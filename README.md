# Syncloop Workflow Editor

This project implements a workflow visualization and editing tool for Syncloop, a low-code API development and management platform. The workflow editor provides a visual interface for designing and managing API workflows with various control structures.

## Features

- Drag and drop interface for creating workflow diagrams
- Support for all Syncloop control structures (Transformer, Group, If-Else, Switch, ForEach, etc.)
- Visual representation of control structures with correct shapes and colors
- Ability to add connections between nodes
- Junction points for cleaner connection routing
- Comments for control structures
- Variable management for Transformer and Service nodes
- Conditional statements display

## Control Structures

The workflow editor supports all Syncloop control structures:

- Transformer (Rectangle, #175CFF)
- Group (Folder symbol, #34D18F)
- If-Else (Square, #9D9C9C)
- Condition (Diamond, #81D6CF)
- Switch (Square, #70B473)
- Case (Diamond, #9EC968)
- ForEach (Trapezium, #D09249)
- Redo (Trapezium, #45C6C4)
- TCF-Block (Triangle, #9B77DC)
- Try (Rectangle, #35D4CB)
- Catch (Rectangle, #9E9E9E)
- Finally (Rectangle, #9B796D)
- Await (Circle, #D3A4B7)
- Service (Rectangle, #CCB474)
- Start (Oval, Green)
- End (Oval, Red)
- Internal condition (Rectangle, White)
- Comment (Message icon, #b2f2bb)
- Many to One Junction (Circle, Black)

## Technologies Used

- React + TypeScript
- Vite
- Rete.js
- React Flow
- Styled Components

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/syncloop-workflow-editor.git
cd syncloop-workflow-editor
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Drag control structures from the toolbox at the top into the canvas
2. Connect nodes by clicking and dragging from one node to another
3. Edit node properties by selecting a node
4. For Transformer and Service nodes, click on them to open the variables panel
5. Save your workflow by clicking the Save button

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Syncloop team for the specifications and requirements
- React Flow for the powerful workflow visualization capabilities
- Rete.js for the node-based editor framework
