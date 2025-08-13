import { CONTROL_STRUCTURE_COLORS, CONTROL_STRUCTURE_SHAPES } from '../constants';
import {
  ControlStructure,
  ControlStructureType,
  Shape,
  Connection,
  Variable
} from './types';

export function convertJsonToFlowchart(jsonData: any): {
  nodes: ControlStructure[];
  connections: Connection[];
} {
  if (!jsonData || !jsonData.latest || !jsonData.latest.api) {
    console.error('Invalid JSON structure');
    return { nodes: [], connections: [] };
  }

  const apiNodes = jsonData.latest.api;
  const nodes: ControlStructure[] = [];
  const connections: Connection[] = [];
  
  // Add Start node at position {x:0, y:0}
  const startNode: ControlStructure = {
    id: 'start-node',
    type: 'Start',
    label: 'START',
    position: { x: 0, y: 0 },
    color: CONTROL_STRUCTURE_COLORS['Start'],
    shape: CONTROL_STRUCTURE_SHAPES['Start'] as Shape,
    children: []
  };
  nodes.push(startNode);
  
  // Process all API nodes
  const finalYPosition = processNodesRecursively(apiNodes, nodes, connections, 1, 0, 'start-node');
  
  // Find the last node at depth 0 (root level)
  let lastRootLevelNode = startNode;
  
  // Filter nodes at depth 0 - these would be nodes with no parent or immediate children of start-node
  const rootLevelNodes = nodes.filter(node => 
    node.parentId === 'start-node' || 
    (node.position.x === 0 && node.id !== 'start-node')
  );
  
  if (rootLevelNodes.length > 0) {
    // Sort by Y position to find the one with the highest Y (last one in the flow)
    rootLevelNodes.sort((a, b) => b.position.y - a.position.y);
    lastRootLevelNode = rootLevelNodes[0];
  }
  
  // Add End node at position {x:0, y: lastY + 130}
  const endNode: ControlStructure = {
    id: 'end-node',
    type: 'End',
    label: 'END',
    position: { x: 0, y: finalYPosition * 135 },
    color: CONTROL_STRUCTURE_COLORS['End'],
    shape: CONTROL_STRUCTURE_SHAPES['End'] as Shape,
    children: []
  };
  nodes.push(endNode);
  
  // Determine if last root level node is a Switch
  const isLastNodeSwitch = lastRootLevelNode.type === 'Switch' || lastRootLevelNode.condition === jsonData?.latest?.api?.find((n: any) => n.id === lastRootLevelNode.id)?.data?.switch;
  
  // Connect the last root level node to the End node
  createConnection(
    connections,
    lastRootLevelNode.id,
    endNode.id,
    'bottom-out',
    'top-in',
    lastRootLevelNode.condition || '',
    isLastNodeSwitch,
    lastRootLevelNode.type,
    false // End node is never a child
  );
  
  return { nodes, connections };
}

function processNodesRecursively(
  jsonNodes: any[],
  resultNodes: ControlStructure[],
  resultConnections: Connection[],
  currentY: number,
  depth: number,
  parentId: string | null
): number {
  let yPosition = currentY;
  
  // Process each node at this level
  for (let i = 0; i < jsonNodes.length; i++) {
    const node = jsonNodes[i];
    
    // Calculate position
    const x = depth * 150;
    const y = yPosition * 135;
    
    // Determine node type and label
    let nodeType = getNodeType(node.text, node.type);
    let nodeLabel = node.text;
    
    // Handle special case for 'invoke' type - extract service name from FQN
    if (node.type === 'invoke' && node.data?.fqn) {
      // Extract the service name from the FQN (last part after the slash)
      const fqnParts = node.data.fqn.split('/');
      if (fqnParts.length > 0) {
        nodeLabel = fqnParts[fqnParts.length - 1];
      }
    }
    
    // Handle special case for CONDITION + sequence
    if (node.text === 'CONDITION' && node.type === 'sequence') {
      nodeLabel = 'Condition';
    }

        // Handle special case for CASE + group
    if (node.text === 'CASE' && node.type === 'group') {
      nodeLabel = 'Case';
    }
    
    // Determine if this is a switch node
    const isSwitch = nodeType === 'Switch' || node.data?.switch !== undefined;
    
    // Extract condition from various possible keys
    const condition = node.data?.condition || node.data?.ifcondition || node.data?.switch || node.data?.case || '';
    
    // Create the node
    const controlStructure: ControlStructure = {
      id: node.id,
      type: nodeType as ControlStructureType,
      label: nodeLabel,
      position: { x, y },
      comment: node.data?.comment || '',
      condition: condition,
      color: CONTROL_STRUCTURE_COLORS[nodeType as keyof typeof CONTROL_STRUCTURE_COLORS] || '#cccccc',
      shape: (CONTROL_STRUCTURE_SHAPES[nodeType as keyof typeof CONTROL_STRUCTURE_SHAPES] as Shape) || ('Rectangle' as Shape),
      children: []
    };
    
    if (parentId) {
      controlStructure.parentId = parentId;
    }
    
    // Add to result nodes
    resultNodes.push(controlStructure);
    
    // Connect to parent if exists and this is the first child
    if (parentId && i === 0) {
      // If parent is Start node, use bottom-out
      const sourceHandle = parentId === 'start-node' ? 'bottom-out' : 'right-out';
      
      // Find the parent node to get its condition
      const parentNode = resultNodes.find(n => n.id === parentId);
      const parentCondition = parentNode?.condition || '';
      const parentIsSwitch = parentNode?.type === 'Switch' || parentNode?.condition === parentNode?.data?.switch;
      
      // Check if parent has children (current node is its child, so it does)
      const parentHasChildren = true;
      
      createConnection(
        resultConnections,
        parentId,
        node.id,
        sourceHandle,
        'top-in',
        parentCondition,
        parentIsSwitch,
        parentNode?.type,
        parentHasChildren
      );
    }
    // Connect to previous sibling node if not the first child
    else if (i > 0 && parentId) {
      const prevNode = jsonNodes[i - 1];
      
      // Find the previous node in the resultNodes to get its condition
      const prevNodeResult = resultNodes.find(n => n.id === prevNode.id);
      const prevCondition = prevNodeResult?.condition || '';
      const prevIsSwitch = prevNodeResult?.type === 'Switch' || prevNodeResult?.condition === prevNode.data?.switch;
      
      // Check if previous node has children
      const prevNodeHasChildren = prevNode.children && prevNode.children.length > 0;
      
      createConnection(
        resultConnections,
        prevNode.id,
        node.id,
        'bottom-out',
        'top-in',
        prevCondition,
        prevIsSwitch,
        prevNodeResult?.type,
        prevNodeHasChildren
      );
    }
    // Connect to previous node at same level if no parent
    else if (i > 0 && !parentId) {
      const prevNode = jsonNodes[i - 1];
      
      // Find the previous node in the resultNodes to get its condition
      const prevNodeResult = resultNodes.find(n => n.id === prevNode.id);
      const prevCondition = prevNodeResult?.condition || '';
      const prevIsSwitch = prevNodeResult?.type === 'Switch' || prevNodeResult?.condition === prevNode.data?.switch;
      
      // Check if previous node has children
      const prevNodeHasChildren = prevNode.children && prevNode.children.length > 0;
      
      createConnection(
        resultConnections,
        prevNode.id,
        node.id,
        'bottom-out',
        'top-in',
        prevCondition,
        prevIsSwitch,
        prevNodeResult?.type,
        prevNodeHasChildren
      );
    }
    
    yPosition++;
    
    // Process children if they exist
    if (node.children && node.children.length > 0) {
      yPosition = processNodesRecursively(
        node.children,
        resultNodes,
        resultConnections,
        yPosition,
        depth + 1,
        node.id
      );
      
      // Special case for Redo node - add loopback connection
      if ((nodeType === 'Redo' || nodeType === 'ForEach') && node.children.length > 0) {
        const lastChild = node.children[node.children.length - 1];
        
        // Find the last child in the resultNodes to get its condition
        const lastChildResult = resultNodes.find(n => n.id === lastChild.id);
        const lastChildCondition = lastChildResult?.condition || '';
        const lastChildIsSwitch = lastChildResult?.type === 'Switch' || lastChildResult?.condition === lastChild.data?.switch;
        
        // Check if last child has children
        const lastChildHasChildren = lastChild.children && lastChild.children.length > 0;
        
        createConnection(
          resultConnections,
          lastChild.id,
          node.id,
          'left-out',
          'bottom-in',
          lastChildCondition,
          lastChildIsSwitch,
          lastChild.type,
          lastChildHasChildren
        );
      }
    }
  }
  
  return yPosition;
}

function createConnection(
  connections: Connection[],
  sourceId: string,
  targetId: string,
  sourceHandle: string,
  targetHandle: string,
  condition?: string,
  isSwitch?: boolean,
  sourceNodeType?: string,
  hasChildren: boolean = true
) {
  let booleanValue = 'None';
  
  // If source node has a condition and sourceHandle is specific, and the source has children, set boolean value
  if (condition && hasChildren) {
    if (sourceNodeType === 'Switch') {
      // No labels for Switch nodes
      booleanValue = 'None';
    } else if (sourceNodeType === 'Case') {
      // Special labels for Case nodes
      if (sourceHandle === 'right-out') {
        booleanValue = 'Equal';
      } else if (sourceHandle === 'bottom-out') {
        booleanValue = 'Not Equal';
      }
    } else {
      // Standard True/False for regular conditions
      if (sourceHandle === 'right-out') {
        booleanValue = 'True';
      } else if (sourceHandle === 'bottom-out') {
        booleanValue = 'False';
      }
    }
  }
  
  connections.push({
    id: `${sourceId}-to-${targetId}`,
    source: sourceId,
    target: targetId,
    sourceHandle,
    targetHandle,
    boolean: booleanValue
  });
}

function getNodeType(text: string, type: string): string {
  // Special case for CONDITION in sequence
  if (text === 'CONDITION' && type === 'sequence') return 'Condition';

  // Special case for CASE in group
  if (text === 'CASE' && type === 'group') return 'Case';
  
  // All invoke nodes should be Service type
  if (type === 'invoke') return 'Service';
  
  switch (type?.toLowerCase()) {
    case 'transformer': return 'Transformer';
    case 'ifelse': return 'If-Else';
    case 'condition': return 'Condition'; // Special case
    case 'switch': return 'Switch';
    case 'case': return 'Case';
    case 'foreach': return 'ForEach';
    case 'redo': return 'Redo';
    case 'tcf-block': return 'TCF-Block';
    case 'try': return 'Try';
    case 'catch': return 'Catch';
    case 'finally': return 'Finally';
    case 'await': return 'Await';
    case 'service': return 'Service';
    case 'start': return 'Start';
    case 'end': return 'End';
    case 'group': return 'Group';
    default: return text;
  }
}