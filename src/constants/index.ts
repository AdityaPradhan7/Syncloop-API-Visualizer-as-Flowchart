export const CONTROL_STRUCTURE_COLORS: Record<ControlStructureType, string> = {
  'Transformer': '#175CFF',
  'Group': '#34D18F',
  'If-Else': '#9D9C9C',
  'Condition': '#81D6CF',
  'Switch': '#70B473',
  'Case': '#9EC968',
  'ForEach': '#D09249',
  'Redo': '#45C6C4',
  'TCF-Block': '#9B77DC',
  'Try': '#35D4CB',
  'Catch': '#9E9E9E',
  'Finally': '#9B796D',
  'Await': '#D3A4B7',
  'Service': '#CCB474',
  'Start': 'green',
  'End': 'red'
};

export const CONTROL_STRUCTURE_SHAPES: Record<ControlStructureType, string> = {
  'Transformer': 'Rectangle',
  'Group': 'Folder symbol',
  'If-Else': 'Square',
  'Condition': 'Diamond',
  'Switch': 'Square',
  'Case': 'Diamond',
  'ForEach': 'Trapezium',
  'Redo': 'Trapezium',
  'TCF-Block': 'Triangle',
  'Try': 'Rectangle',
  'Catch': 'Rectangle',
  'Finally': 'Rectangle',
  'Await': 'Circle',
  'Service': 'Rectangle',
  'Start': 'Oval',
  'End': 'Oval'
};

export const VALID_CHILDREN: Record<ControlStructureType, ControlStructureType[]> = {
  'Transformer': [],
  'Group': ['Transformer', 'Group', 'If-Else', 'Switch', 'ForEach', 'TCF-Block', 'Redo', 'Await', 'Service'],
  'If-Else': ['Condition'],
  'Condition': ['Transformer', 'Group', 'If-Else', 'Switch', 'ForEach', 'TCF-Block', 'Redo', 'Await', 'Service'],
  'Switch': ['Case'],
  'Case': ['Transformer', 'Group', 'If-Else', 'Switch', 'ForEach', 'TCF-Block', 'Redo', 'Await', 'Service'],
  'ForEach': ['Transformer', 'Group', 'If-Else', 'Switch', 'ForEach', 'TCF-Block', 'Redo', 'Await', 'Service'],
  'Redo': ['Transformer', 'Group', 'If-Else', 'Switch', 'ForEach', 'TCF-Block', 'Redo', 'Await', 'Service'],
  'TCF-Block': ['Try', 'Catch', 'Finally'],
  'Try': ['Transformer', 'Group', 'If-Else', 'Switch', 'ForEach', 'TCF-Block', 'Redo', 'Await', 'Service'],
  'Catch': ['Transformer', 'Group', 'If-Else', 'Switch', 'ForEach', 'TCF-Block', 'Redo', 'Await', 'Service'],
  'Finally': ['Transformer', 'Group', 'If-Else', 'Switch', 'ForEach', 'TCF-Block', 'Redo', 'Await', 'Service'],
  'Await': ['Transformer', 'Group', 'If-Else', 'Switch', 'ForEach', 'TCF-Block', 'Redo', 'Await', 'Service'],
  'Service': [],
  'Start': ['Transformer', 'Group', 'If-Else', 'Switch', 'ForEach', 'TCF-Block', 'Redo', 'Await', 'Service'],
  'End': []
}; 