"use client";

import { Task, Column, groupTasks, columns } from "@/lib/kanban/board";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";

type Props = {
  tasks: Task[];
  onStatusChange: (taskId: string, status: Task["status"]) => void;
};

export function KanbanBoard({ tasks, onStatusChange }: Props) {
  const grouped = groupTasks(tasks);

  // 🧠 сенсоры (как в Linear)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;

    /**
     * 🟢 КЛЮЧЕВОЕ ИЗМЕНЕНИЕ:
     * over.id теперь = COLUMN ID (а не task id)
     */
    const newStatus = over.data?.current?.status as Task["status"];

    if (!taskId || !newStatus) return;

    onStatusChange(taskId, newStatus);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-3 gap-4">

        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={grouped[col.id]}
          />
        ))}

      </div>
    </DndContext>
  );
}

/**
 * 🟢 COLUMN = DROP ZONE
 */
function KanbanColumn({
  column,
  tasks,
}: {
  column: Column;
  tasks: Task[];
}) {
  return (
    <div
      className="min-h-[400px] rounded-lg bg-gray-100 p-3"
      data-status={column.id}
    >
      <h2 className="mb-3 font-bold">
        {column.title}
      </h2>

      {tasks.map((task) => (
        <KanbanCard key={task.id} task={task} />
      ))}
    </div>
  );
}

/**
 * 🧩 CARD
 */
function KanbanCard({ task }: { task: Task }) {
  return (
    <div
      id={task.id}
      className="mb-2 cursor-grab rounded bg-white p-3 shadow"
      data-task-id={task.id}
    >
      {task.title}
    </div>
  );
}