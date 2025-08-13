import React, { useState, memo } from 'react';
import { 
  getNodeComponent, 
  NodeLabel, 
  ConditionLabel,
  CommentIcon
} from './NodeStyles';
import { CONTROL_STRUCTURE_SHAPES, CONTROL_STRUCTURE_COLORS } from '../constants';
import { NodeProps as ReactFlowNodeProps, Handle, Position } from 'reactflow';

interface CustomNodeData {
  type: string;
  color: string;
  label: string;
  comment?: string;
  condition?: string;
  caseValue?: string;
  switchValue?: string;
  inputList?: string;
  outputList?: string;
  interval?: string;
  repeat?: string;
  hasHandles?: boolean;
  enableConditionEvaluation?: boolean;
  children?: string[];
}

// Extending the ReactFlow NodeProps
export type NodeProps = ReactFlowNodeProps<CustomNodeData>;

const Node: React.FC<NodeProps> = ({ id, data, selected }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Early return if data is missing
  if (!data) {
    console.error('Node data is missing', id);
    return null;
  }

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Determine what properties to show based on node type
  const excludedConditionTypes = ['Start', 'End'];
  const showCondition = !excludedConditionTypes.includes(data.type);
  const showSwitch = data.type === 'Switch';
  const showCase = data.type === 'Case';
  const showRedo = data.type === 'Redo';
  
  // Comment box component
const renderCommentBox = () => {
  if (!data.comment) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        top: '-15.5px',
        left: '119%',
        background: 'white',
        border: '1px solid #7a7a7a',
        borderRadius: '4px',
        paddingLeft: '4px',
        paddingRight: '4px',
        maxWidth: 'fit-content',
        fontSize: '14.5px',
        fontWeight: '500',
        textWrap: 'nowrap',
        color: '#000000',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      {data.comment}
    </div>
  );
};


  // Define the renderNodeDetails function within component scope
  const renderNodeDetails = () => {
    return (
      <>
        {/* Show condition only when it has content */}
        {showCondition && data.condition && (
          <ConditionLabel className="condition-label">
            {data.condition}
          </ConditionLabel>
        )}
        
        {/* Show case value */}
        {showCase && data.caseValue && (
          <ConditionLabel className="condition-label">{data.caseValue}</ConditionLabel>
        )}
        
        {/* Show switch value */}
        {showSwitch && data.switchValue && (
          <ConditionLabel className="condition-label">{data.switchValue}</ConditionLabel>
        )}
        
        {/* Show redo interval and repeat */}
        {showRedo && (data.interval || data.repeat) && (
          <ConditionLabel className="condition-label">
            {data.interval && `Interval: ${data.interval}ms`}
            {data.interval && data.repeat && ', '}
            {data.repeat && `Repeat: ${data.repeat}`}
          </ConditionLabel>
        )}
        
        {/* Show ForEach input/output list */}
        {data.inputList && data.outputList && (
          <ConditionLabel className="condition-label">{data.inputList}--&gt;{data.outputList}</ConditionLabel>
        )}
        
        {data.inputList && !data.outputList && (
          <ConditionLabel className="condition-label">{data.inputList}</ConditionLabel>
        )}
        
        {/* Show comment icon if there's a comment */}
        {data.comment && (
          <CommentIcon onClick={handleCommentClick} style={{zIndex: 10}}>
            💬
          </CommentIcon>
        )}
        
        {renderCommentBox()}
      </>
    );
  };

  const nodeShape = CONTROL_STRUCTURE_SHAPES[data.type as keyof typeof CONTROL_STRUCTURE_SHAPES] || 'Rectangle';
  const NodeComponent = getNodeComponent(nodeShape as any);
  const isDiamond = nodeShape === 'Diamond';
  const isTrapezium = nodeShape === 'Trapezium';
  const isTriangle = nodeShape === 'Triangle';

  // Special handling for Start node
  if (data.type === 'Start') {
    return (
      <div style={{ position: 'relative' }}>
        {data.hasHandles && (
          <>
            {/* Start node only has one source handle at the bottom */}
            <Handle 
              type="source" 
              position={Position.Bottom} 
              id="bottom-out"
              style={{ background: '#555' }} 
            />
          </>
        )}
        
        <NodeComponent 
          color={data.color} 
          selected={!!selected} 
          onClick={() => {}}
        >
          <NodeLabel dangerouslySetInnerHTML={{ __html: data.label }} />
        </NodeComponent>
        
        {renderNodeDetails()}
      </div>
    );
  }

  // Special handling for End node
  if (data.type === 'End') {
    return (
      <div style={{ position: 'relative' }}>
        {data.hasHandles && (
          <>
            {/* End node only has one target handle at the top */}
            <Handle 
              type="target" 
              position={Position.Top} 
              id="top-in"
              style={{ background: '#555' }} 
            />
          </>
        )}
        
        <NodeComponent 
          color={data.color} 
          selected={!!selected} 
          onClick={() => {}}
        >
          <NodeLabel dangerouslySetInnerHTML={{ __html: data.label }} />
        </NodeComponent>
        
        {renderNodeDetails()}
      </div>
    );
  }

  // Default node rendering for all other shapes
  return (
    <div style={{ position: 'relative' }}>
      {data.hasHandles && (
        <>
          {/* Standard nodes now have 4 handles: 
            - Target handle on top
            - Source handles on left, right and bottom */}
          <Handle 
            type="target" 
            position={Position.Top} 
            id="top-in"
            style={{ 
              background: '#555',
              top: isDiamond ? '-19px' : '-6px',   // Distance from top edge
              left: '50%'   // Center horizontally
            }} 
          />
          <Handle 
            type="source" 
            position={Position.Left} 
            id="left-out"
            style={{ 
              background: '#555',
              left: isDiamond ? '-16px' : isTrapezium ? '3px' : isTriangle ? '20px' : '-6px',
              top: '50%'      // Center vertically
            }} 
          />
          {/* Right source handle - excluded for Transformer and Service nodes */}
          {data.type !== 'Transformer' && data.type !== 'Service' && (
            <Handle 
              type="source" 
              position={Position.Right} 
              id="right-out"
              style={{ 
                background: '#555',
                right: isDiamond ? '-16px' : isTrapezium ? '3px' : isTriangle ? '20px' : '-6px',
                top: '50%'      // Center vertically
              }} 
            />
          )}
          
          {/* Special case for Redo and ForEach nodes - they get both a source and target handle at bottom */}
          {data.type === 'Redo' || data.type === 'ForEach' ? (
            <>
              {/* Bottom-source-handle on the left side */}
              <Handle 
                type="source" 
                position={Position.Bottom} 
                id="bottom-out"
                style={{ 
                  background: '#555',
                  bottom: isDiamond ? '-15px' : '-6px',  // Distance from bottom edge
                  left: '50%'      // Position to the left
                }} 
              />
              {/* Bottom-target-handle on the right side */}
              <Handle 
                type="target" 
                position={Position.Bottom} 
                id="bottom-in"
                style={{ 
                  background: '#555',
                  bottom: isDiamond ? '-15px' : '-6px',  // Distance from bottom edge
                  left: '71%'      // Position to the right
                }} 
              />
            </>
          ) : (
            /* Regular bottom source handle for other nodes */
            <Handle 
              type="source" 
              position={Position.Bottom} 
              id="bottom-out"
              style={{ 
                background: '#555',
                bottom: isDiamond ? '-18px' : '-6px',  // Distance from bottom edge
                left: '50%'      // Center horizontally
              }} 
            />
          )}
        </>
      )}
      
      <NodeComponent 
        color={data.color} 
        selected={!!selected} 
        onClick={() => {}}
      >
        <NodeLabel dangerouslySetInnerHTML={{ __html: data.label }} />
      </NodeComponent>

      {renderNodeDetails()}
    </div>
  );
};

export default memo(Node); 