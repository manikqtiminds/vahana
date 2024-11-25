import React from 'react';
import { Rect, Text, Group } from 'react-konva';

const DamageAnnotation = ({
  damage,
  isSelected,
  onSelect,
  onChange,
  stageWidth,
  stageHeight,
}) => {
  const shapeRef = React.useRef();

  const { coordinates } = damage;
  const x = coordinates.x1;
  const y = coordinates.y1;
  const width = coordinates.x2 - coordinates.x1;
  const height = coordinates.y2 - coordinates.y1;

  return (
    <Group
      x={0}
      y={0}
      draggable={false}
      onClick={onSelect}
      onTap={onSelect}
    >
      <Rect
        ref={shapeRef}
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(0, 0, 255, 0.2)"
        stroke={isSelected ? 'red' : 'blue'}
        strokeWidth={isSelected ? 2 : 1}
      />
      <Text
        x={x}
        y={y - 20}
        text={damage.CarPartName || 'Damage'}
        fontSize={14}
        fill="black"
      />
    </Group>
  );
};

export default DamageAnnotation;
