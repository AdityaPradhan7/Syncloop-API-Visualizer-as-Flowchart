import { useState } from 'react';
import './App.css';
import WorkflowEditor from './components/WorkflowEditor';
import {
  ControlStructure,
  ControlStructureType,
  Shape,
  Connection,
  Variable
} from './utils/types';
import { CONTROL_STRUCTURE_COLORS, CONTROL_STRUCTURE_SHAPES } from './constants';
import flowchartData from './data/flowchartData.json';
import { convertJsonToFlowchart } from './utils/jsonToFlowConverter';

// Interface for parameter definition
interface Parameter {
  name: string;
  type: string;
  children?: Parameter[];
  id?: string; // Added for tracking expanded state
}

// JSON interfaces
interface InitiateListItem {
  path: string;
  typePath: string;
  id?: string;
}

interface CreateListItem extends InitiateListItem {
  value?: any;
}

interface NodeData {
  evaluate?: boolean;
  condition?: string;
  comment?: string;
  createList?: CreateListItem[];
  initiateList?: InitiateListItem[];
  transformers?: any[];
  lines?: any[];
  dropList?: any[];
  redo?: string;
  guid?: string;
  columnType?: string;
  snap?: string;
}

interface JsonNode {
  id?: string;
  text: string;
  type: string;
  data?: NodeData;
  children: JsonNode[];
  state?: any;
  li_attr?: any;
  a_attr?: any;
}

interface JsonOutputParam {
  text: string;
  type: string;
  children: any[];
}

interface WorkflowJson {
  latest: {
    input: any[];
    output: JsonOutputParam[];
    api: JsonNode[];
  }
}

function App() {
  // Define input and output parameters
  const [inputParams, setInputParams] = useState<Parameter[]>([{
    name: 'n',
    type: 'integer',
    children: [],
    id: 'j2_1'
  }
  // structure for nested input and output parameters
  //   {
  //   name: 'parent',
  //   type: 'document',
  //   children: [
  //     {
  //       name: 'child1',
  //       type: 'string',
  //       children: [],
  //       id: 'param-2-1'
  //     },
  //     {
  //       name: 'child2',
  //       type: 'integer',
  //       children: [],
  //       id: 'param-2-2'
  //     }
  //   ],
  //   id: 'j2_2'
  // }
  ]);
  
  // Add unique IDs to parameters for tracking expanded state
  const [outputParams, setOutputParams] = useState<Parameter[]>([
    {
      name: 'output',
      type: 'string',
      children: [],
      id: 'j3_1'
    },
  ]);

  // Track expanded state of parameters
  const [expandedParams, setExpandedParams] = useState<Record<string, boolean>>({
    'param-2': true // Start with 'parent' expanded
  });

  // Toggle expanded state of a parameter
  const toggleExpanded = (paramId: string) => {
    setExpandedParams(prev => ({
      ...prev,
      [paramId]: !prev[paramId]
    }));
  };

  // Helper to generate a unique ID for parameters from JSON
  const generateParamId = () => `param-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Helper function to create nodes with automatic shape and color based on type
  const createNode = (nodeData: Partial<ControlStructure>): ControlStructure => {
    // Ensure type is defined
    if (!nodeData.type) {
      throw new Error('Node type is required');
    }
    
    // Get default shape and color from constants based on type
    const defaultShape = CONTROL_STRUCTURE_SHAPES[nodeData.type as ControlStructureType] as Shape;
    const defaultColor = CONTROL_STRUCTURE_COLORS[nodeData.type as ControlStructureType];
    
    // Determine if condition should be included based on node type
    const excludedTypes = ['Start', 'End', 'Many to One Junction'];
    const shouldHaveCondition = !excludedTypes.includes(nodeData.type);
    
    // Create default values
    const defaults: Partial<ControlStructure> = {
      id: `node-${Date.now()}`,
      type: nodeData.type as ControlStructureType,
      shape: defaultShape,
      color: defaultColor,
      label: nodeData.type,
      position: { x: 0, y: 0 },
      comment: '',
      evaluate: 'False',
      children: []
    };
    
    // Add condition field if applicable
    if (shouldHaveCondition) {
      defaults.condition = '';
    }
    
    // Merge defaults with provided values, giving priority to provided values
    return { ...defaults, ...nodeData } as ControlStructure;
  };

  // Parse JSON to generate nodes and connections
  const parseWorkflowJson = (jsonData: string): { 
    nodes: ControlStructure[],
    connections: Connection[],
    inputParams: Parameter[],
    outputParams: Parameter[]
  } => {
    try {
      const parsedJson: WorkflowJson = JSON.parse(jsonData);
      const result = {
        nodes: [] as ControlStructure[],
        connections: [] as Connection[],
        inputParams: [] as Parameter[],
        outputParams: [] as Parameter[]
      };
      
      // Helper function to recursively parse parameter nodes
      const parseParamNode = (node: any): Parameter => {
        return {
          name: node.text,
          type: node.type,
          children: node.children?.map((child: any) => parseParamNode(child)) || [],
          id: node.id || generateParamId()
        };
      };
      
      // Parse input parameters
      result.inputParams = parsedJson.latest.input.map(input => parseParamNode(input));
      
      // Parse output parameters
      result.outputParams = parsedJson.latest.output.map(output => parseParamNode(output));
      
      // Add Start and End nodes
      const startNode = createNode({
        id: 'start',
        type: 'Start',
        label: 'Start',
        position: { x: -10, y: 100 },
        comment: '',
        evaluate: 'False'
      });
      
      const endNode = createNode({
        id: 'end',
        type: 'End',
        label: 'End',
        position: { x: 670, y: 100 },
        comment: '',
        evaluate: 'False'
      });
      
      result.nodes.push(startNode);
      
      // Parse API nodes
      const processedNodeIds: Map<JsonNode, string> = new Map();
      const childrenMap: Map<string, string[]> = new Map();
      
      // Function to recursively process nodes
      const processNode = (node: JsonNode, parentId: string | undefined, xPos: number, yPos: number): string => {
        // Generate a unique ID for this node
        const nodeId = `${node.type.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Convert the JSON node to our ControlStructure
        const controlStructure: Partial<ControlStructure> = {
          id: nodeId,
          type: node.type as ControlStructureType,
          label: node.text,
          position: { x: xPos, y: yPos },
          comment: node.data?.comment || '',
          condition: node.data?.condition || '',
          evaluate: node.data?.evaluate ? 'True' : 'False',
          parentId: parentId,
          children: []
        };
        
        // Add variables if they exist (for Transformer nodes)
        if (node.type === 'transformer') {
          const variables: Variable[] = [];
          
          // Process createList items
          if (node.data?.createList) {
            node.data.createList.forEach(item => {
              variables.push({
                name: item.path,
                type: item.typePath as any,
                value: item.value
              });
            });
          }
          
          // Process initiateList items that aren't in createList
          if (node.data?.initiateList) {
            node.data.initiateList.forEach(item => {
              // Check if this variable is already in the variables array
              const existingVar = variables.find(v => v.name === item.path);
              if (!existingVar) {
                variables.push({
                  name: item.path,
                  type: item.typePath as any
                });
              }
            });
          }
          
          if (variables.length > 0) {
            controlStructure.variables = variables;
          }
        }
        
        // Create and add the node
        const createdNode = createNode(controlStructure);
        result.nodes.push(createdNode);
        
        // Store this node's children IDs for later
        const childrenIds: string[] = [];
        
        // Process children
        if (node.children && node.children.length > 0) {
          // Calculate positions for children
          const childCount = node.children.length;
          const childrenStartX = xPos - (childCount * 100) / 2;
          
          node.children.forEach((child, index) => {
            const childX = childrenStartX + index * 100;
            const childY = yPos + 150; // Place children below the parent
            
            const childId = processNode(child, nodeId, childX, childY);
            childrenIds.push(childId);
            
            // Add connection from parent to child
            result.connections.push({
              id: `edge-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              source: nodeId,
              target: childId,
              sourceHandle: 'bottom-out',
              targetHandle: 'top-in',
              boolean: 'None'
            });
          });
        }
        
        // Store children IDs
        childrenMap.set(nodeId, childrenIds);
        
        return nodeId;
      };
      
      // Process the API nodes
      let firstApiNodeId: string | null = null;
      
      if (parsedJson.latest.api && parsedJson.latest.api.length > 0) {
        const rootX = 300; // X position for root nodes
        const rootY = 100; // Y position for root nodes
        
        parsedJson.latest.api.forEach((apiNode, index) => {
          const rootNodeId = processNode(apiNode, undefined, rootX + index * 200, rootY);
          
          if (index === 0) {
            firstApiNodeId = rootNodeId;
            
            // Connect start node to first API node
            result.connections.push({
              id: `edge-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              source: startNode.id,
              target: rootNodeId,
              sourceHandle: 'right-out',
              targetHandle: 'left-in',
              boolean: 'None'
            });
          }
          
          // If this is the last node, connect it to end node
          if (index === parsedJson.latest.api.length - 1) {
            result.connections.push({
              id: `edge-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              source: rootNodeId,
              target: endNode.id,
              sourceHandle: 'right-out',
              targetHandle: 'left-in',
              boolean: 'None'
            });
          }
        });
      }
      
      // Add end node
      result.nodes.push(endNode);
      
      // Update nodes with their children
      result.nodes = result.nodes.map(node => {
        const children = childrenMap.get(node.id) || [];
        return {
          ...node,
          children
        };
      });
      
      return result;
    } catch (error) {
      console.error("Error parsing workflow JSON:", error);
      return {
        nodes: [],
        connections: [],
        inputParams: [],
        outputParams: []
      };
    }
  };





  // Convert JSON to flowchart data
  const flowchartResult = convertJsonToFlowchart(flowchartData);
  
  // Initialize nodes from the converted JSON
  const [nodes, setNodes] = useState<ControlStructure[]>(flowchartResult.nodes);
  
  // Initialize connections from the converted JSON
  const [connections, setConnections] = useState<Connection[]>(flowchartResult.connections);





  // Example of using the JSON parser
  const loadWorkflowFromJson = (jsonData: string) => {
    const { nodes: parsedNodes, connections: parsedConnections, inputParams, outputParams } = parseWorkflowJson(jsonData);
    setNodes(parsedNodes);
    setConnections(parsedConnections);
    setInputParams(inputParams);
    setOutputParams(outputParams);
    
    // Initialize expanded state for document type parameters
    const newExpandedState: Record<string, boolean> = {};
    const initExpandedState = (params: Parameter[]) => {
      params.forEach(param => {
        if (param.type === 'document' && param.id) {
          newExpandedState[param.id] = true;
        }
        if (param.children && param.children.length > 0) {
          initExpandedState(param.children);
        }
      });
    };
    
    initExpandedState(inputParams);
    initExpandedState(outputParams);
    setExpandedParams(newExpandedState);
  };

  // Callback function when the workflow is saved
  const handleSave = (updatedNodes: ControlStructure[], updatedConnections: Connection[]) => {
    console.log('Workflow saved:', { nodes: updatedNodes, connections: updatedConnections });
    
    // Process any incoming nodes to ensure they have proper defaults
    const processedNodes = updatedNodes.map(node => {
      // If the node already has a shape and color, it has been processed before
      if (node.shape && node.color) {
        return node;
      }
      return createNode(node);
    });
    
    setNodes(processedNodes);
    setConnections(updatedConnections);
  };

  // Render parameter panel
  const renderParameterPanel = (params: Parameter[], title: string, className: string) => {
    // Helper function to render parameters recursively
    const renderParams = (parameters: Parameter[], indent: number = 0) => {
      return parameters.map((param, index) => {
        const hasChildren = param.children && param.children.length > 0;
        const isDocument = param.type === 'document';
        const isExpanded = param.id ? expandedParams[param.id] : false;
        
        return (
          <div key={index}>
            <div 
              className={`param-item ${isDocument ? 'param-document' : ''}`}
              style={{ paddingLeft: `${indent * 20}px` }}
              data-has-children={hasChildren ? "true" : "false"}
              data-expanded={isExpanded ? "true" : "false"}
              onClick={() => isDocument && param.id && toggleExpanded(param.id)}
            >
              <span className="param-type" data-type={param.type}>{param.type}</span>
              <span className="param-name">{param.name}</span>
            </div>
            {hasChildren && isExpanded && 
              renderParams(param.children || [], indent + 1)
            }
          </div>
        );
      });
    };

    return (
      <div className={`param-panel ${className}`}>
        <h3 className="panel-title">{title}</h3>
        {params.length > 0 ? (
          renderParams(params)
        ) : (
          <div className="no-params">No parameters defined</div>
        )}
      </div>
    );
  };

  return (
    <div className="App">
      {/*<header className="App-header">
        <h1>Flowchart View</h1>
        <h2>Syncloop API Visualization</h2>
      </header>*/}
      
      {/* Input Parameters Panel */}
      {/* {renderParameterPanel(inputParams, 'Input Parameters', 'input-panel')} */}
      
      {/* Output Parameters Panel */}
      {/* {renderParameterPanel(outputParams, 'Output Parameters', 'output-panel')} */}

      {/* Main Workflow Editor */}
      <div className="workflow-container">
        <WorkflowEditor
        initialNodes={nodes}
        initialConnections={connections}
        onSave={(updatedNodes, updatedConnections) => {
          setNodes(updatedNodes);
          setConnections(updatedConnections);
        }}
      />
      </div>
    </div>
  );
}

export default App;