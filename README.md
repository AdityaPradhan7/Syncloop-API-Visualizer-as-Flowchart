# Syncloop API Visualizer as Flowchart

This project implements a visualization for the APIs of Syncloop, a low-code API development platform. This tool provides a visual interface for understanding the API workflow as a flowchart.

## Features

- Support for all Syncloop control structures (Transformer, Group, If-Else, Switch, ForEach, etc.)
- Visual representation of control structures with relevant shapes and colors
- Ability to add connections between nodes
- Comments for control structures
- Conditional statements (True/False) display

## Tree View v/s Flowchart View

### 1. Switch-Case API

### Tree View

<img width="1920" height="498" alt="Screenshot (1319)" src="https://github.com/user-attachments/assets/8163e5ea-e2a8-4cfa-a948-3ebdf6fee259" />

### Flowchart View

<img width="1920" height="1080" alt="Screenshot (1440)" src="https://github.com/user-attachments/assets/2cc5de4e-96b4-4e8e-904f-f7b4e516877e" />

### 2. Nested Redo loops API

### Tree View

<img width="1920" height="772" alt="Screenshot (1330)" src="https://github.com/user-attachments/assets/b9c52e6d-e2b7-44a6-9273-f10903dc904c" />

### Flowchart View
<img width="1920" height="1080" alt="Screenshot (1438)" src="https://github.com/user-attachments/assets/aa6729c1-1304-45f1-9554-a90eb8476688" />


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
- React Flow
