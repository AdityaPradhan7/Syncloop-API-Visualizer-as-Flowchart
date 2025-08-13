import styled from 'styled-components';

interface NodeContainerProps {
  color: string;
  selected: boolean;
}

export const NodeContainer = styled.div<NodeContainerProps>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: ${(props) =>
    props.selected ? '1px solid rgb(255, 0, 0)' : '0.5px solid #555'};
  box-shadow: ${(props) =>
    props.selected ? '0 0px 16px rgba(191, 45, 45, 01)' : '0 0 0px rgba(0, 0, 0, 0.8)'};
  cursor: pointer;
  user-select: none;
  font-family: Arial, sans-serif;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: ${(props) =>
      props.selected
        ? '0 0px 10px rgba(255, 0, 0, 0.7)'
        : '0 0px 9px rgba(218, 32, 32, 0.4)'};
  }
`;


export const RectangleNode = styled(NodeContainer)`
  width: 120px;
  height: 55px;
  background-color: ${(props: NodeContainerProps) => props.color};
  color: white;
  border-radius: 8px;
  & > * {
    text-shadow: #000 0 0 10px;
  }
`;

export const SquareNode = styled(NodeContainer)`
  width: 120px;
  height: 50px;
  background-color: ${(props: NodeContainerProps) => props.color};
  color: white;
  border-radius: 8px;
  transform: skew(-20deg);
  & > * {
    text-shadow: #000 0 0 10px;
    transform: skew(20deg);
  }
`;

export const DiamondNode = styled(NodeContainer)`
  width: 80px;
  height: 80px;
  background-color: ${(props: NodeContainerProps) => props.color};
  transform: rotate(45deg);
  border-radius: 8px;

  & > * {
    transform: rotate(-45deg);
    text-shadow: #222222 0 0 10px;
  }
`;

export const TrapeziumNode = styled(NodeContainer)`
  width: 120px;
  height: 65px;
  background-color: ${(props: NodeContainerProps) => props.color};
  color: white;
  clip-path: polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%);
  position: relative;
  border-radius: 5px;
  z-index: 1;
  & > * {
    text-shadow: #000 0 0 10px;
  }
`;

export const TriangleNode = styled(NodeContainer)`
  width: 120px;
  height: 95px;
  background-color: ${(props: NodeContainerProps) => props.color};
  color: white;
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
  border-radius:10px;

  & > * {
    margin-top:20px;
    text-shadow: #000 0 0 10px;
  }
`;

export const CircleNode = styled(NodeContainer)`
  width: 120px;
  height: 110px;
  background-color: ${(props: NodeContainerProps) => props.color};
  color: white;
  border-radius: 50%;
  & > * {
    text-shadow: #000 0 0 10px;
  }
`;

export const OvalNode = styled(NodeContainer)`
  width: 120px;
  height: 50px;
  background-color: ${(props: NodeContainerProps) => props.color};
  color: white;
  border-radius: 50px;
  & > * {
    text-shadow: #000 0 0 10px;
  }
`;

export const FolderNode = styled(NodeContainer)`
  width: 120px;
  height: 55px;
  background-color: ${(props: NodeContainerProps) => props.color};
  color: white;
  border-radius: 8px;
  
  
  &:before {
    z-index: -1;
    content: '';
    position: absolute;
    top: -8px;
    left: 0;
    width: 40%;
    height: 10px;
    background-color: ${(props: NodeContainerProps)  => {
      // Create a darker version of the provided color
      return `color-mix(in srgb, ${props.color} 76%, black)`;
    }};
    border-radius: 10px 10px 0 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0);
  }
  & > * {
    text-shadow: #000 0 0 10px;
  }
`;

export const MessageIconNode = styled(NodeContainer)`
  width: 80px;
  height: 60px;
  background-color: ${(props: NodeContainerProps) => props.color};
  color: white;
  border-radius: 8px;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 15px;
    width: 0;
    height: 0;
    border-left: 0px solid transparent;
    border-right: 0px solid transparent;
    border-top: 0px solid ${(props: NodeContainerProps) => props.color};
  }
`;

export const NodeLabel = styled.div`
  font-size: 16.5px;
  font-weight: 600;
  display: flex;
  justify-content: center; /* horizontal center */
  align-items: center;     /* vertical center */
  width: 100%;
  height: 100%;            /* assume container has height */
  padding: 5px;
  text-align: center;
`;


export const ConditionLabel = styled.div`
  position: absolute;
  bottom: -7px;
  text-wrap: nowrap;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0px 4px 0px;
  font-size: 13px;
  color: black;
  white-space: nowrap; /* prevents text wrap */
  z-index: 100;
  pointer-events: auto;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);

  /* Center the label horizontally below the node */
  left: 50%;
  transform: translateX(-50%);
  font-weight: 500;

  display: inline-block;
  max-width: fit-content;
  text-align: center;
`;

export const CommentIcon = styled.div`
  position: absolute;
  top: -8px;
  right: -9%;
  background: none;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  border: none;
  padding: 0;
  line-height: 1;
`;

type NodeComponent = typeof RectangleNode | typeof SquareNode | typeof DiamondNode | 
                    typeof TrapeziumNode | typeof TriangleNode | typeof CircleNode | 
                    typeof OvalNode | typeof FolderNode | typeof MessageIconNode;

export const getNodeComponent = (shape: Shape): NodeComponent => {
  switch (shape) {
    case 'Rectangle':
      return RectangleNode;
    case 'Square':
      return SquareNode;
    case 'Diamond':
      return DiamondNode;
    case 'Trapezium':
      return TrapeziumNode;
    case 'Triangle':
      return TriangleNode;
    case 'Circle':
      return CircleNode;
    case 'Oval':
      return OvalNode;
    case 'Folder symbol':
      return FolderNode;
    case 'Message icon':
      return MessageIconNode;
    default:
      return RectangleNode;
  }
};