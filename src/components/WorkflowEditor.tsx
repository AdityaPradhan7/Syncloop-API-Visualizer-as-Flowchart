import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  NodeChange,
  EdgeChange,
  ConnectionLineType,
  MarkerType,
  ReactFlowInstance,
  Node as ReactFlowNode,
  NodeTypes,
  EdgeTypes,
  Handle,
  Position,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import styled from "styled-components";
import {
  ControlStructure,
  ControlStructureType,
  Shape,
  Variable
} from '../utils/types';
import {
  CONTROL_STRUCTURE_COLORS,
  VALID_CHILDREN,
  CONTROL_STRUCTURE_SHAPES,
} from "../constants";
import Node from "./Node";
import CustomLabeledEdge from "./CustomLabeledEdge";

// Define the NodeTypes with proper type casting
const CustomNodeTypes: NodeTypes = {
  customNode: Node as any,
};

// Define the EdgeTypes with our custom edge component
const CustomEdgeTypes: EdgeTypes = {
  customEdge: CustomLabeledEdge,
};

const WorkflowContainer = styled.div`
  width: 100vw;
  height: 100vh;
  z-index: 100;
`;

const ToolboxContainer = styled.div`
  visibility: hidden;
  display: flex;
  background-color: rgb(239, 238, 238);
  flex-wrap: wrap;
  margin-right: -80px;
  overflow-x: auto;
  margin-bottom: 10px;
`;

interface ToolboxItemProps {
  color: string;
}

const ToolboxItem = styled.div<ToolboxItemProps>`
  padding: 7px 11px;
  margin: 5px;
  background-color: ${(props: ToolboxItemProps) => props.color};
  color: white;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  font-size: 0.95rem;

  &:hover {
    opacity: 0.8;
  }
`;

const PopupContainer = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  width: 565px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  color: #000000;
`;

const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const PopupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
`;

const PopupTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #000000;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #000000;
`;

const VariablesList = styled.div`
  margin-top: 15px;
  color: #000000;
`;

const VariableItem = styled.div`
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  align-items: center;
  color: #000000;

  &:last-child {
    border-bottom: none;
  }
`;

const VariableName = styled.input`
  flex: 1;
  font-weight: 500;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 8px;
  color: #000000;
  background-color: white;
`;

const VariableType = styled.select`
  width: 100px;
  color: #000000;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 8px;
  background-color: white;
`;

const VariableValue = styled.input`
  flex: 1;
  color: #000000;
  font-family: monospace;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
`;

const ActionButton = styled.button`
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  margin-left: 8px;
  cursor: pointer;

  &:hover {
    background-color: #3367d6;
  }

  &.delete {
    background-color: #f44336;

    &:hover {
      background-color: #d32f2f;
    }
  }
`;

const AddVariableButton = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  margin-top: 15px;
  cursor: pointer;
  width: 100%;

  &:hover {
    background-color: #388e3c;
  }
`;

const TextareaContainer = styled.div`
  margin-top: 15px;
  color: #000000;
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  min-height: 10px;
  padding: 1px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  resize: vertical;
  color: #000000;
  background-color: white;
`;

// Add styled component for section headings
const SectionHeading = styled.h4`
  margin: 15px 0 10px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
`;

// Update the CSS styling for edges
const StyledWorkflowContainer = styled(WorkflowContainer)`
  .react-flow__edge-path {
    stroke-width: 2;
    stroke: #b1b1b7;
  }

  /* Ensure smooth edges are maintained even with labels */
  .react-flow__edge.has-label .react-flow__edge-path,
  .react-flow__edge .react-flow__edge-path {
    stroke-dasharray: none !important;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
`;

interface WorkflowEditorProps {
  initialNodes?: ControlStructureType[];
  initialConnections?: ConnectionType[];
  onSave?: (
    nodes: ControlStructureType[],
    connections: ConnectionType[]
  ) => void;
}

// Helper function to add handles to nodes
const addHandlesToNodes = (nodes: ReactFlowNode[]): ReactFlowNode[] => {
  return nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      hasHandles: true,
    },
  }));
};

// Helper function to convert our data model to React Flow format
const convertToReactFlowNodes = (
  nodes: ControlStructureType[]
): ReactFlowNode[] => {
  return nodes.map((node) => ({
    id: node.id,
    type: "customNode",
    data: {
      type: node.type,
      shape: node.shape,
      color: node.color,
      label: node.label,
      comment: node.comment,
      condition: node.condition,
      evaluate: node.evaluate || "False",
      caseValue: node.caseValue,
      switchValue: node.switchValue,
      inputList: node.inputList,
      outputList: node.outputList,
      executionType: node.executionType,
      variables: node.variables,
      hasHandles: true,
      children: node.children || [],
    },
    position: node.position,
  }));
};

const convertToReactFlowEdges = (connections: ConnectionType[]): Edge[] => {
  return connections.map((conn) => {
    const label =
      conn.boolean && conn.boolean !== "None" ? conn.boolean : undefined;

    // Check if this is a switch edge label
    const isSwitchEdge = label === "Switch Present" || label === "Switch Absent";
    
    // Check if this is a case edge label
    const isCaseEdge = label === "Equal" || label === "Not Equal";
    
    // Decide label color and glow based on boolean value or switch/case status
    let labelColor = "#000"; // default color
    
    if (isSwitchEdge) {
      if (label === "Switch Present") {
        labelColor = "#3bd97e"; // green
      } else if (label === "Switch Absent") {
        labelColor = "#ff796b"; // red
      }
    } else if (isCaseEdge) {
      if (label === "Equal") {
        labelColor = "#3bd97e"; // green
      } else if (label === "Not Equal") {
        labelColor = "#ff796b"; // red
      }
    } else {
      // Standard True/False styling
      if (conn.boolean === "True") {
        labelColor = "#3bd97e"; // green
      } else if (conn.boolean === "False") {
        labelColor = "#ff796b"; // red
      }
    }

    return {
      id: conn.id,
      source: conn.source,
      target: conn.target,
      sourceHandle: conn.sourceHandle,
      targetHandle: conn.targetHandle,
      type: "customEdge",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20, // Larger width
        height: 20, // Larger height
        color: "#c9c9c9", // Match edge color
      },
      label,
      labelStyle: {
        fill: labelColor,
        fontWeight: "bold",
        fontSize: "12px",
      },
      // Background style for switch/case edges (wider to accommodate longer text)
      labelBgStyle: (isSwitchEdge || isCaseEdge) ? {
        fill: "rgba(18, 18, 18, 0.75)",
        rx: 4,
        width: label?.length ? label.length * 9 : undefined // Adjust width based on label length
      } : undefined,
      style: {
        strokeWidth: 1.5, // true edge thickness
        stroke: "#1c1c1c", // true edge color
      },
    };
  });
};

// Helper function to format variable values for display
const formatVariableValue = (variable: Variable): string => {
  if (variable.value === null || variable.value === undefined) {
    return "";
  }

  if (variable.type === "integer" || variable.type === "number") {
    return variable.value.toString();
  }

  if (variable.type === "string") {
    return variable.value as string;
  }

  return JSON.stringify(variable.value);
};

const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  initialNodes = [],
  initialConnections = [],
  onSave,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    addHandlesToNodes(convertToReactFlowNodes(initialNodes))
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    convertToReactFlowEdges(initialConnections)
  );
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showVariablesPopup, setShowVariablesPopup] = useState(false);
  const [showConditionPopup, setShowConditionPopup] = useState(false);
  const [showSwitchPopup, setShowSwitchPopup] = useState(false);
  const [showCasePopup, setShowCasePopup] = useState(false);
  const [showRedoPopup, setShowRedoPopup] = useState(false);
  const [showPropertiesPopup, setShowPropertiesPopup] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [conditionText, setConditionText] = useState("");
  const [switchValue, setSwitchValue] = useState("");
  const [caseValue, setCaseValue] = useState("");
  const [executionType, setExecutionType] = useState("Synchronous");
  const [enableConditionEvaluation, setEnableConditionEvaluation] =
    useState(false);
  const [redoValues, setRedoValues] = useState({
    condition: "",
    interval: "",
    repeat: "",
  });
  const [variables, setVariables] = useState<Variable[]>([]);

  // Auto-fit the flow when nodes/edges change
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      // Only fit view on initial load, not when nodes/edges change
      if (nodes.length === initialNodes.length) {
        setTimeout(() => {
          reactFlowInstance.fitView({ padding: 0.2 });
        }, 200);
      }
    }
  }, [reactFlowInstance, nodes.length, initialNodes.length]);

  // Handler for when a connection is created
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdgeId = `edge-${Date.now()}`;

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: newEdgeId,
            type: "customEdge", // Use our custom edge type
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20, // Larger width
              height: 20, // Larger height
              color: "#00ff44", // Match edge color
            },
            style: { strokeWidth: 2, stroke: "#b1b1b7" }, // Apply consistent styling to all edges
          },
          eds
        )
      );

      // Add the new connection to the initialConnections array
      // Make sure source and target are valid strings
      if (params.source && params.target) {
        // Ensure sourceHandle and targetHandle end with -in or -out as appropriate
        let sourceHandle = params.sourceHandle;
        let targetHandle = params.targetHandle;

        // Fix handles if they don't have the correct suffix
        if (sourceHandle && !sourceHandle.includes("-")) {
          sourceHandle = `${sourceHandle}-out`; // Default to output
        }

        if (targetHandle && !targetHandle.includes("-")) {
          targetHandle = `${targetHandle}-in`; // Default to input
        }

        const newConnection: ConnectionType = {
          id: newEdgeId,
          source: params.source,
          target: params.target,
          sourceHandle: sourceHandle || undefined,
          targetHandle: targetHandle || undefined,
          boolean: "None",
        };

        // If onSave is provided, call it with updated nodes and connections
        if (onSave) {
          // Get current nodes as our data model format
          const currentNodes = nodes.map((node) => {
            const controlStructure: ControlStructureType = {
              id: node.id,
              type: node.data.type,
              shape: node.data.shape,
              color: node.data.color,
              label: node.data.label,
              position: node.position,
              children: [],
            };

            // Add optional properties
            if (node.data.comment) controlStructure.comment = node.data.comment;
            if (node.data.condition)
              controlStructure.condition = node.data.condition;
            if (node.data.evaluate)
              controlStructure.evaluate = node.data.evaluate;
            if (node.data.caseValue)
              controlStructure.caseValue = node.data.caseValue;
            if (node.data.switchValue)
              controlStructure.switchValue = node.data.switchValue;
            if (node.data.inputList)
              controlStructure.inputList = node.data.inputList;
            if (node.data.outputList)
              controlStructure.outputList = node.data.outputList;
            if (node.data.executionType)
              controlStructure.executionType = node.data.executionType;
            if (node.data.variables)
              controlStructure.variables = node.data.variables;

            return controlStructure;
          });

          // Add the new connection to the existing connections
          const updatedConnections = [...initialConnections, newConnection];

          onSave(currentNodes, updatedConnections);
        }
      }
    },
    [setEdges, onSave, nodes, initialConnections]
  );

  // Handle node selection - keep this for left-click selection only
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: ReactFlowNode) => {
      setSelectedNode(node.id);
    },
    []
  );

  // Handle right-click context menu for nodes to open popups
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: ReactFlowNode) => {
      // Prevent default browser context menu
      event.preventDefault();

      // Do not open popups for Start, End, or Many to One Junction nodes
      if (
        node.data?.type === "Start" ||
        node.data?.type === "End" ||
        node.data?.type === "Many to One Junction"
      ) {
        return;
      }

      // Select the node
      setSelectedNode(node.id);

      // Set comment text for all node types
      setCommentText(node.data?.comment || "");

      // Check node type and open appropriate popup
      if (node.data) {
        switch (node.data.type) {
          case "Transformer":
          case "Service":
            const nodeVars = node.data.variables || [];
            setVariables([...nodeVars]);
            setExecutionType(node.data.executionType || "Synchronous");
            setShowVariablesPopup(true);
            break;
          case "Condition":
            setConditionText(node.data.condition || "");
            setEnableConditionEvaluation(node.data.evaluate === "True");
            setShowConditionPopup(true);
            break;
          case "Switch":
            setSwitchValue(node.data.switchValue || "");
            setShowSwitchPopup(true);
            break;
          case "Case":
            setCaseValue(node.data.caseValue || "");
            setEnableConditionEvaluation(node.data.evaluate === "True");
            setShowCasePopup(true);
            break;
          case "Try":
          case "Catch":
          case "Finally":
            setEnableConditionEvaluation(node.data.evaluate === "True");
            setShowPropertiesPopup(true);
            break;
          case "Group":
            setEnableConditionEvaluation(node.data.evaluate === "True");
            setShowPropertiesPopup(true);
            break;
          case "Redo":
            setRedoValues({
              condition: node.data.condition || "",
              interval: node.data.interval || "",
              repeat: node.data.repeat || "",
            });
            setShowRedoPopup(true);
            break;
          // For all other node types, show a basic popup with just comment field
          default:
            // For If-Else, ForEach, TCF-Block, Try, Catch, Finally, Await
            setShowPropertiesPopup(true);
            break;
        }
      }
    },
    []
  );

  // Handle pane click to unselect nodes
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Handle edge click to now delete the edge
  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      const confirmed = window.confirm(
        "Do you want to delete this connection?"
      );
      if (confirmed) {
        setEdges((edges) => edges.filter((e) => e.id !== edge.id));

        // Also update the original connections array
        const updatedConnections = initialConnections.filter(
          (conn) => conn.id !== edge.id
        );

        // If onSave is provided, call it with updated nodes and connections
        if (onSave) {
          onSave(
            // Convert ReactFlow nodes back to our data model
            nodes.map((node) => {
              const controlStructure: ControlStructureType = {
                id: node.id,
                type: node.data.type,
                shape: node.data.shape,
                color: node.data.color,
                label: node.data.label,
                position: node.position,
                children: [],
              };

              // Add optional properties
              if (node.data.comment)
                controlStructure.comment = node.data.comment;
              if (node.data.condition)
                controlStructure.condition = node.data.condition;
              if (node.data.evaluate)
                controlStructure.evaluate = node.data.evaluate;
              if (node.data.caseValue)
                controlStructure.caseValue = node.data.caseValue;
              if (node.data.switchValue)
                controlStructure.switchValue = node.data.switchValue;
              if (node.data.inputList)
                controlStructure.inputList = node.data.inputList;
              if (node.data.outputList)
                controlStructure.outputList = node.data.outputList;
              if (node.data.executionType)
                controlStructure.executionType = node.data.executionType;
              if (node.data.variables)
                controlStructure.variables = node.data.variables;

              return controlStructure;
            }),
            updatedConnections
          );
        }
      }
    },
    [initialConnections, nodes, onSave, setEdges]
  );

  // Add handler for edge right-click to toggle boolean value
  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();

      // Find the connection from initialConnections
      const connectionIndex = initialConnections.findIndex(
        (conn) => conn.id === edge.id
      );
      if (connectionIndex === -1) return;

      // Get the current boolean value
      const currentBoolean =
        initialConnections[connectionIndex].boolean || "None";

      // Toggle between None -> True -> False -> None
      let newBoolean: "None" | "True" | "False";
      if (currentBoolean === "None") {
        newBoolean = "True";
      } else if (currentBoolean === "True") {
        newBoolean = "False";
      } else {
        newBoolean = "None";
      }

      // Update the edge in the reactflow visualization
      setEdges((edges) =>
        edges.map((e) => {
          if (e.id === edge.id) {
            return {
              ...e,
              type: "customEdge", // Use our custom edge type
              label: newBoolean !== "None" ? newBoolean : undefined,
              labelStyle: {
                fill: "#000",
                fontWeight: "bold",
                fontSize: "12px",
              },
              labelBgStyle: { fill: "rgba(255, 255, 255, 0.75)", rx: 4, ry: 4 },
              style: { strokeWidth: 2, stroke: "#b1b1b7" }, // Apply consistent styling
            };
          }
          return e;
        })
      );

      // Update the connection in our data model
      const updatedConnections = [...initialConnections];
      updatedConnections[connectionIndex] = {
        ...updatedConnections[connectionIndex],
        boolean: newBoolean,
      };

      // If onSave is provided, call it with updated nodes and connections
      if (onSave) {
        onSave(
          // Convert ReactFlow nodes back to our data model
          nodes.map((node) => {
            const controlStructure: ControlStructureType = {
              id: node.id,
              type: node.data.type,
              shape: node.data.shape,
              color: node.data.color,
              label: node.data.label,
              position: node.position,
              children: [],
            };

            // Add optional properties
            if (node.data.comment) controlStructure.comment = node.data.comment;
            if (node.data.condition)
              controlStructure.condition = node.data.condition;
            if (node.data.evaluate)
              controlStructure.evaluate = node.data.evaluate;
            if (node.data.caseValue)
              controlStructure.caseValue = node.data.caseValue;
            if (node.data.switchValue)
              controlStructure.switchValue = node.data.switchValue;
            if (node.data.inputList)
              controlStructure.inputList = node.data.inputList;
            if (node.data.outputList)
              controlStructure.outputList = node.data.outputList;
            if (node.data.executionType)
              controlStructure.executionType = node.data.executionType;
            if (node.data.variables)
              controlStructure.variables = node.data.variables;

            return controlStructure;
          }),
          updatedConnections
        );
      }
    },
    [initialConnections, nodes, onSave, setEdges]
  );

  // Handle node deletion
  const deleteNode = useCallback(() => {
    if (!selectedNode) return;

    // Delete node immediately without confirmation
    setNodes((nodes) => nodes.filter((n) => n.id !== selectedNode));

    // Delete any connected edges
    setEdges((edges) =>
      edges.filter(
        (e) => e.source !== selectedNode && e.target !== selectedNode
      )
    );

    // Close any open popups
    closePopups();
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  // Update comment for any node type
  const updateNodeComment = useCallback(
    (nodeId: string, comment: string) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                comment,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Update condition for a Condition node
  const updateCondition = useCallback(() => {
    if (!selectedNode) return;

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === selectedNode) {
          return {
            ...node,
            data: {
              ...node.data,
              condition: conditionText,
              evaluate: enableConditionEvaluation ? "True" : "False",
            },
          };
        }
        return node;
      })
    );

    setShowConditionPopup(false);
  }, [selectedNode, conditionText, enableConditionEvaluation, setNodes]);

  // Update switch value
  const updateSwitchValue = useCallback(() => {
    if (!selectedNode) return;

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === selectedNode) {
          return {
            ...node,
            data: {
              ...node.data,
              switchValue: switchValue,
            },
          };
        }
        return node;
      })
    );

    setShowSwitchPopup(false);
  }, [selectedNode, switchValue, setNodes]);

  // Update case value
  const updateCaseValue = useCallback(() => {
    if (!selectedNode) return;

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === selectedNode) {
          return {
            ...node,
            data: {
              ...node.data,
              caseValue: caseValue,
              evaluate: enableConditionEvaluation ? "True" : "False",
            },
          };
        }
        return node;
      })
    );

    setShowCasePopup(false);
  }, [selectedNode, caseValue, enableConditionEvaluation, setNodes]);

  // Update redo values
  const updateRedoValues = useCallback(() => {
    if (!selectedNode) return;

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === selectedNode) {
          return {
            ...node,
            data: {
              ...node.data,
              condition: redoValues.condition,
              interval: redoValues.interval,
              repeat: redoValues.repeat,
            },
          };
        }
        return node;
      })
    );

    setShowRedoPopup(false);
  }, [selectedNode, redoValues, setNodes]);

  // Update variables for a node
  const updateVariables = useCallback(() => {
    if (!selectedNode) return;

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === selectedNode) {
          return {
            ...node,
            data: {
              ...node.data,
              variables: variables,
              executionType:
                node.data.type === "Service"
                  ? executionType
                  : node.data.executionType,
            },
          };
        }
        return node;
      })
    );

    setShowVariablesPopup(false);
  }, [selectedNode, variables, executionType, setNodes]);

  // Handle variable change
  const handleVariableChange = (
    index: number,
    field: keyof Variable,
    value: any
  ) => {
    const updatedVariables = [...variables];
    updatedVariables[index] = {
      ...updatedVariables[index],
      [field]: value,
    };
    setVariables(updatedVariables);
  };

  // Add a new variable
  const addVariable = () => {
    setVariables([
      ...variables,
      {
        name: "",
        type: "string",
        value: "",
      },
    ]);
  };

  // Remove a variable
  const removeVariable = (index: number) => {
    const updatedVariables = [...variables];
    updatedVariables.splice(index, 1);
    setVariables(updatedVariables);
  };

  // Close popups
  const closePopups = () => {
    setShowVariablesPopup(false);
    setShowConditionPopup(false);
    setShowSwitchPopup(false);
    setShowCasePopup(false);
    setShowRedoPopup(false);
    setShowPropertiesPopup(false);
  };

  // Drag and drop functionality
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const typeData = event.dataTransfer.getData("application/reactflow");
      if (!typeData) return;

      // Make sure the typeData is a valid ControlStructureType
      const type = typeData as keyof typeof CONTROL_STRUCTURE_COLORS;
      if (!(type in CONTROL_STRUCTURE_COLORS)) {
        console.error(`Invalid control structure type: ${type}`);
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Format the label, adding a line break for TCF-Block
      const label = type === "TCF-Block" ? "TCF<br/>Block" : type;

      const newNode = {
        id: `${type}-${Date.now()}`,
        type: "customNode",
        data: {
          type: type,
          shape: CONTROL_STRUCTURE_SHAPES[type],
          color: CONTROL_STRUCTURE_COLORS[type],
          label: label,
          hasHandles: true,
        },
        position,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );

  // Toolbox item drag start
  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  // Save workflow
  const saveWorkflow = useCallback(() => {
    if (onSave) {
      const controlStructures: ControlStructureType[] = nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        shape: node.data.shape || "Rectangle",
        color: node.data.color,
        label: node.data.label,
        comment: node.data.comment,
        condition: node.data.condition,
        evaluate: node.data.evaluate || "False",
        caseValue: node.data.caseValue,
        switchValue: node.data.switchValue,
        inputList: node.data.inputList,
        outputList: node.data.outputList,
        executionType: node.data.executionType,
        variables: node.data.variables || [],
        position: node.position,
        children: [],
      }));

      // Find the boolean value for each edge from the initialConnections
      const connections: ConnectionType[] = edges.map((edge) => {
        // Try to find the existing connection to get its boolean value
        const existingConnection = initialConnections.find(
          (conn) => conn.id === edge.id
        );

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || undefined,
          targetHandle: edge.targetHandle || undefined,
          boolean: existingConnection?.boolean || "None",
        };
      });

      onSave(controlStructures, connections);
    }
  }, [nodes, edges, initialConnections, onSave]);

  // Update Group node properties
  const updateGroupProperties = useCallback(() => {
    if (!selectedNode) return;

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === selectedNode) {
          // Add evaluate for Group, Condition, Case, Try, Catch, and Finally nodes
          const nodeType = node.data.type;
          const enabledTypes = [
            "Group",
            "Condition",
            "Case",
            "Try",
            "Catch",
            "Finally",
          ];

          if (enabledTypes.includes(nodeType)) {
            return {
              ...node,
              data: {
                ...node.data,
                evaluate: enableConditionEvaluation ? "True" : "False",
              },
            };
          } else {
            // For other node types, just return the node as is
            return node;
          }
        }
        return node;
      })
    );

    setShowPropertiesPopup(false);
  }, [selectedNode, enableConditionEvaluation, setNodes]);

  // Remove CSS to hide nodes since we don't need it anymore
  useEffect(() => {
    // No-op - we don't need to add or remove any styles
  }, []);

  return (
    <StyledWorkflowContainer>
      <ToolboxContainer>
        {Object.keys(CONTROL_STRUCTURE_COLORS).map((type) => (
          <ToolboxItem
            key={type}
            color={
              CONTROL_STRUCTURE_COLORS[
                type as keyof typeof CONTROL_STRUCTURE_COLORS
              ]
            }
            onDragStart={(event) => onDragStart(event, type)}
            draggable
          >
            {type}
          </ToolboxItem>
        ))}
      </ToolboxContainer>

      <ReactFlowProvider>
        <div
          style={{
            top: "0%",
            height: "100vh",
            width: "100%",
            background: "rgba(242, 242, 242, 1)", // canvas / react-flow-renderer color
            position: "absolute",
          }}
          ref={reactFlowWrapper}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onNodeClick={onNodeClick}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeClick={onEdgeClick}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={CustomNodeTypes}
            edgeTypes={CustomEdgeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            minZoom={0.5} // Add this line to allow zooming out further
            maxZoom={4}   // Optional: also allow more zoom in
            defaultEdgeOptions={{
              type: "customEdge",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20, // Larger width
                height: 20, // Larger height
                color: "#00ff44", // Match edge color
              },
              style: { strokeWidth: 6, stroke: "#00ff44" },
            }}
            fitView
          >
            {/* Custom SVG marker definition for larger arrowheads */}
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 0,
                height: 0,
              }}
            >
              <defs>
                <marker // arrow or arrowhead
                  id="larger-arrowhead"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#1c1c1c" /> {/* arrow color */}
                </marker>
              </defs>
            </svg>

            <Controls />
            <MiniMap 
              nodeColor={(node) => node.data?.color || '#eee'}
              nodeStrokeWidth={3}
              nodeStrokeColor="#222"
              // maskColor="rgba(0, 0, 0, 0.1)"
              pannable= {true}
              zoomable={true}
              zoomStep={1}
              style={{
                position: 'absolute',
                bottom: '0px',
                right: '1px',
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #222',
                borderRadius: '5px',
                width: 220,
                height: 220
              }}
            />
            {/* react-flow-renderer dots */}
            <Background
              variant={BackgroundVariant.Dots}
              gap={25}
              size={1.4}
              color="rgba(0, 0, 0, 1)"
            />
            <Panel position="top-right">
              {selectedNode && (
                <button
                  onClick={deleteNode}
                  style={{ backgroundColor: "#f44336" , padding: "5px", borderRadius: "5px", color: "#fff", border: "none", cursor: "pointer" }}
                >
                  Delete Node
                </button>
              )}
            </Panel>
          </ReactFlow>
        </div>
      </ReactFlowProvider>

      {/* Variables Popup for Transformer and Service */}
      {showVariablesPopup && selectedNode && (
        <>
          <PopupOverlay onClick={closePopups} />
          <PopupContainer>
            <PopupHeader>
              <PopupTitle>Properties</PopupTitle>
              <CloseButton onClick={closePopups}>×</CloseButton>
            </PopupHeader>

            <SectionHeading>Comment</SectionHeading>
            <TextareaContainer>
              <StyledTextarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Enter your comment here..."
                style={{ minHeight: "20px", maxHeight: "40px" }}
              />
            </TextareaContainer>

            <SectionHeading>Variables</SectionHeading>
            <VariablesList>
              {variables.length > 0 ? (
                variables.map((variable: Variable, index: number) => (
                  <VariableItem key={index}>
                    <VariableName
                      value={variable.name}
                      onChange={(e) =>
                        handleVariableChange(index, "name", e.target.value)
                      }
                      placeholder="Name"
                    />
                    <VariableType
                      value={variable.type}
                      onChange={(e) =>
                        handleVariableChange(index, "type", e.target.value)
                      }
                    >
                      <option value="string">string</option>
                      <option value="integer">integer</option>
                      <option value="number">number</option>
                      <option value="date">date</option>
                      <option value="boolean">boolean</option>
                      <option value="byte">byte</option>
                      <option value="object">object</option>
                      <option value="document">document</option>
                    </VariableType>
                    <VariableValue
                      value={formatVariableValue(variable)}
                      onChange={(e) =>
                        handleVariableChange(index, "value", e.target.value)
                      }
                      placeholder="Value"
                    />
                    <ActionButton
                      className="delete"
                      onClick={() => removeVariable(index)}
                    >
                      Delete
                    </ActionButton>
                  </VariableItem>
                ))
              ) : (
                <div>No variables defined yet.</div>
              )}
            </VariablesList>

            <AddVariableButton onClick={addVariable}>
              Add Variable
            </AddVariableButton>

            {/* Only show Execution Type for Service nodes */}
            {nodes.find((node) => node.id === selectedNode)?.data.type ===
              "Service" && (
              <>
                <SectionHeading>Execution Type</SectionHeading>
                <div style={{ marginBottom: "15px" }}>
                  <VariableType
                    value={executionType}
                    onChange={(e) => setExecutionType(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="Synchronous">Synchronous</option>
                    <option value="Asynchronous">Asynchronous</option>
                  </VariableType>
                </div>
              </>
            )}

            <div
              style={{
                marginTop: "15px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <ActionButton
                onClick={() => {
                  if (selectedNode) {
                    updateNodeComment(selectedNode, commentText);
                    updateVariables();
                  }
                }}
              >
                Save Properties
              </ActionButton>
            </div>
          </PopupContainer>
        </>
      )}

      {/* Condition Popup */}
      {showConditionPopup && (
        <>
          <PopupOverlay onClick={closePopups} />
          <PopupContainer>
            <PopupHeader>
              <PopupTitle>Properties</PopupTitle>
              <CloseButton onClick={closePopups}>×</CloseButton>
            </PopupHeader>

            <SectionHeading>Comment</SectionHeading>
            <TextareaContainer>
              <StyledTextarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Enter your comment here..."
                style={{ minHeight: "20px", maxHeight: "40px" }}
              />
            </TextareaContainer>

            <SectionHeading>Condition</SectionHeading>
            <TextareaContainer>
              <StyledTextarea
                value={conditionText}
                onChange={(e) => setConditionText(e.target.value)}
                placeholder="Enter condition expression (e.g. x > 5)"
              />
            </TextareaContainer>

            <div style={{ marginTop: "15px", marginBottom: "15px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={enableConditionEvaluation}
                  onChange={(e) =>
                    setEnableConditionEvaluation(e.target.checked)
                  }
                  style={{ marginRight: "8px" }}
                />
                <span>Enable condition evaluation on sub-step(s)</span>
              </label>
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <ActionButton
                onClick={() => {
                  if (selectedNode) {
                    updateNodeComment(selectedNode, commentText);
                    updateCondition();
                  }
                }}
              >
                Save Properties
              </ActionButton>
            </div>
          </PopupContainer>
        </>
      )}

      {/* Switch Popup */}
      {showSwitchPopup && (
        <>
          <PopupOverlay onClick={closePopups} />
          <PopupContainer>
            <PopupHeader>
              <PopupTitle>Properties</PopupTitle>
              <CloseButton onClick={closePopups}>×</CloseButton>
            </PopupHeader>

            <SectionHeading>Comment</SectionHeading>
            <TextareaContainer>
              <StyledTextarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Enter your comment here..."
                style={{ minHeight: "20px", maxHeight: "40px" }}
              />
            </TextareaContainer>

            <SectionHeading>Switch Value</SectionHeading>
            <TextareaContainer>
              <StyledTextarea
                value={switchValue}
                onChange={(e) => setSwitchValue(e.target.value)}
                placeholder="Enter switch expression (e.g. status)"
              />
            </TextareaContainer>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <ActionButton
                onClick={() => {
                  if (selectedNode) {
                    updateNodeComment(selectedNode, commentText);
                    updateSwitchValue();
                  }
                }}
              >
                Save Properties
              </ActionButton>
            </div>
          </PopupContainer>
        </>
      )}

      {/* Case Popup */}
      {showCasePopup && (
        <>
          <PopupOverlay onClick={closePopups} />
          <PopupContainer>
            <PopupHeader>
              <PopupTitle>Properties</PopupTitle>
              <CloseButton onClick={closePopups}>×</CloseButton>
            </PopupHeader>

            <SectionHeading>Comment</SectionHeading>
            <TextareaContainer>
              <StyledTextarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Enter your comment here..."
                style={{ minHeight: "20px", maxHeight: "40px" }}
              />
            </TextareaContainer>

            <SectionHeading>Case Value</SectionHeading>
            <TextareaContainer>
              <StyledTextarea
                value={caseValue}
                onChange={(e) => setCaseValue(e.target.value)}
                placeholder="Enter case value..."
              />
            </TextareaContainer>

            <div style={{ marginTop: "15px", marginBottom: "15px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={enableConditionEvaluation}
                  onChange={(e) =>
                    setEnableConditionEvaluation(e.target.checked)
                  }
                  style={{ marginRight: "8px" }}
                />
                <span>Enable condition evaluation on sub-step(s)</span>
              </label>
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <ActionButton
                onClick={() => {
                  if (selectedNode) {
                    updateNodeComment(selectedNode, commentText);
                    updateCaseValue();
                  }
                }}
              >
                Save Properties
              </ActionButton>
            </div>
          </PopupContainer>
        </>
      )}

      {/* Redo Popup */}
      {showRedoPopup && (
        <>
          <PopupOverlay onClick={closePopups} />
          <PopupContainer>
            <PopupHeader>
              <PopupTitle>Properties</PopupTitle>
              <CloseButton onClick={closePopups}>×</CloseButton>
            </PopupHeader>

            <SectionHeading>Comment</SectionHeading>
            <TextareaContainer>
              <StyledTextarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Enter your comment here..."
                style={{ minHeight: "20px", maxHeight: "40px" }}
              />
            </TextareaContainer>

            <SectionHeading>Redo Properties</SectionHeading>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Condition:
              </label>
              <StyledTextarea
                value={redoValues.condition}
                onChange={(e) =>
                  setRedoValues({ ...redoValues, condition: e.target.value })
                }
                placeholder="Enter loop condition..."
                style={{ minHeight: "60px" }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Interval:
              </label>
              <VariableValue
                value={redoValues.interval}
                onChange={(e) =>
                  setRedoValues({ ...redoValues, interval: e.target.value })
                }
                placeholder="Unit- milliseconds"
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                Repeat:
              </label>
              <VariableValue
                value={redoValues.repeat}
                onChange={(e) =>
                  setRedoValues({ ...redoValues, repeat: e.target.value })
                }
                placeholder="Enter repeat count..."
              />
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <ActionButton
                onClick={() => {
                  if (selectedNode) {
                    updateNodeComment(selectedNode, commentText);
                    updateRedoValues();
                  }
                }}
              >
                Save Properties
              </ActionButton>
            </div>
          </PopupContainer>
        </>
      )}

      {/* Generic Properties Popup */}
      {showPropertiesPopup && selectedNode && (
        <>
          <PopupOverlay onClick={closePopups} />
          <PopupContainer>
            <PopupHeader>
              <PopupTitle>Properties</PopupTitle>
              <CloseButton onClick={closePopups}>×</CloseButton>
            </PopupHeader>

            <SectionHeading>Comment</SectionHeading>
            <TextareaContainer>
              <StyledTextarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Enter your comment here..."
                style={{ minHeight: "20px", maxHeight: "40px" }}
              />
            </TextareaContainer>

            {/* Show checkbox for specific node types */}
            {(() => {
              const nodeType = nodes.find((node) => node.id === selectedNode)
                ?.data.type;
              const enabledTypes = [
                "Group",
                "Condition",
                "Case",
                "Try",
                "Catch",
                "Finally",
              ];

              if (nodeType && enabledTypes.includes(nodeType)) {
                return (
                  <div style={{ marginTop: "15px", marginBottom: "15px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={enableConditionEvaluation}
                        onChange={(e) =>
                          setEnableConditionEvaluation(e.target.checked)
                        }
                        style={{ marginRight: "8px" }}
                      />
                      <span>Enable condition evaluation on sub-step(s)</span>
                    </label>
                  </div>
                );
              }
              return null;
            })()}

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <ActionButton
                onClick={() => {
                  if (selectedNode) {
                    updateNodeComment(selectedNode, commentText);
                    updateGroupProperties();
                  }
                }}
              >
                Save
              </ActionButton>
            </div>
          </PopupContainer>
        </>
      )}
    </StyledWorkflowContainer>
  );
};

export default WorkflowEditor;
