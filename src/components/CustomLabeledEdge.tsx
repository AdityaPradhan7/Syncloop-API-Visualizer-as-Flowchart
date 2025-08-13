import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { EdgeProps, getSmoothStepPath, getBezierPath } from 'reactflow';

interface CustomLabeledEdgeProps extends EdgeProps {
  // Additional props if needed
}

// Define an extended type for label background style
interface LabelBgStyle extends React.CSSProperties {
  fill?: string;
  rx?: number;
}

export default function CustomLabeledEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  label,
  labelStyle,
  labelBgStyle,
}: CustomLabeledEdgeProps) {
  // State to store the calculated label position
  const [labelPosition, setLabelPosition] = useState({ x: 0, y: 0 });
  // Track whether path is available yet
  const [pathReady, setPathReady] = useState(false);

  // Calculate the path using SmoothStep for consistency with the project
  const [edgePath, defaultLabelX, defaultLabelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Function to calculate the 10% point along the SVG path
  const calculateLabelPosition = useCallback(() => {
    try {
      const pathElement = document.getElementById(id) as SVGPathElement | null;
      if (!pathElement) {
        // Fallback to simple linear interpolation if path not available
        return {
          x: sourceX + (targetX - sourceX) * 0.1,
          y: sourceY + (targetY - sourceY) * 0.1
        };
      }
      
      // Get total path length and calculate position
      const pathLength = pathElement.getTotalLength();
      
      // Check if the label is "Switch Present" and use 45% position instead of 30%
      if (label === "Switch Present") {
        const point = pathElement.getPointAtLength(pathLength * 0.42);
        return { x: point.x, y: point.y };
      } else {
        // Default position at 30% for all other labels
        const point = pathElement.getPointAtLength(pathLength * 0.22);
        return { x: point.x, y: point.y };
      }
    } catch (error) {
      // Fallback to simple linear interpolation if any error occurs
      return {
        x: sourceX + (targetX - sourceX) * 0.1,
        y: sourceY + (targetY - sourceY) * 0.1
      };
    }
  }, [id, sourceX, sourceY, targetX, targetY, label]);

  // Update label position when the path element becomes available
  useEffect(() => {
    const calculatePosition = () => {
      const position = calculateLabelPosition();
      setLabelPosition(position);
      setPathReady(true);
    };

    // Check if path element is already available
    if (document.getElementById(id)) {
      calculatePosition();
    } else {
      // If not, wait for a short time and try again
      // This ensures the path is rendered before we try to measure it
      const timer = setTimeout(calculatePosition, 50);
      return () => clearTimeout(timer);
    }
  }, [id, calculateLabelPosition, edgePath]);

  // Re-calculate when edge parameters change significantly
  useEffect(() => {
    if (pathReady) {
      setLabelPosition(calculateLabelPosition());
    }
  }, [pathReady, calculateLabelPosition, sourceX, sourceY, targetX, targetY]);

  // Cast labelBgStyle to our extended interface
  const customLabelBgStyle = labelBgStyle as LabelBgStyle;

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeLinejoin: 'round',
          strokeLinecap: 'round',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {label && (
        <foreignObject
          width={typeof label === 'string' 
            ? (label === "Equal" || label === "Not Equal") 
              ? label.length * 10 
              : label.length > 5 
                ? label.length * 8 
                : 40
            : 40
          }
          height={24}
          // Use the calculated position directly
          x={labelPosition.x - (typeof label === 'string'
            ? (label === "Equal" || label === "Not Equal")
              ? label.length * 3.5
              : label.length > 5
                ? label.length * 3
                : 12
            : 12
          )} // Center horizontally
          y={labelPosition.y -9} // Center vertically
          className="edgebutton-foreignobject"
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div
            style={{
              background: customLabelBgStyle?.fill || 'rgba(0, 0, 0, 0.79)', // edge label background color
              borderRadius: customLabelBgStyle?.rx !== undefined ? customLabelBgStyle.rx : 4,
              color: labelStyle?.fill || '#000',
              paddingLeft:"2px",
              paddingRight:"2px",
              fontWeight: labelStyle?.fontWeight || 'bold',
              fontSize: labelStyle?.fontSize || '12px',
              fontFamily: labelStyle?.fontFamily || 'inherit',
              textAlign: 'center',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '15px',
              pointerEvents: 'all',
              maxWidth:"fit-content",
              whiteSpace: 'nowrap'
            }}
          >
            {label}
          </div>
        </foreignObject>
      )}
    </>
  );
} 