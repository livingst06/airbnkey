"use client"

import { useMemo, useState } from "react"
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import type { Apartment } from "@/types/apartments"
import { cn } from "@/lib/utils"

import { useApartments } from "./apartments-context"
import { AdminAddApartmentCard } from "./admin-add-apartment-card"
import { ApartmentCardAdmin } from "./apartment-card-admin"
import { AdminApartmentDialog } from "./admin-apartment-dialog"
import { AdminDeleteConfirmDialog } from "./admin-delete-confirm-dialog"

function SortableAdminSlot({
  apartment,
  onEdit,
  onDelete,
}: {
  apartment: Apartment
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: apartment.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "min-h-0 min-w-0 cursor-grab touch-manipulation active:cursor-grabbing",
        isDragging && "relative z-10 opacity-95",
      )}
      {...attributes}
      {...listeners}
    >
      <ApartmentCardAdmin
        apartment={apartment}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

const GRID_CLASS =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

export function AdminPanel() {
  const { apartments, reorderApartments, deleteApartment } = useApartments()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingApartmentId, setEditingApartmentId] = useState<string | null>(
    null,
  )

  const [deleteApartmentId, setDeleteApartmentId] = useState<string | null>(
    null,
  )

  const editingApartment = useMemo(() => {
    if (!editingApartmentId) return null
    return apartments.find((a) => a.id === editingApartmentId) ?? null
  }, [apartments, editingApartmentId])

  const deleteVictim = useMemo(() => {
    if (!deleteApartmentId) return null
    return apartments.find((a) => a.id === deleteApartmentId) ?? null
  }, [apartments, deleteApartmentId])

  const itemIds = useMemo(() => apartments.map((a) => a.id), [apartments])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = apartments.findIndex((a) => a.id === active.id)
    const newIndex = apartments.findIndex((a) => a.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = arrayMove(apartments, oldIndex, newIndex)
    reorderApartments(
      reordered.map((a, i) => ({ id: a.id, position: i })),
    )
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingApartmentId(null)
  }

  const openAdd = () => {
    setEditingApartmentId(null)
    setDialogOpen(true)
  }

  const openEdit = (id: string) => {
    setEditingApartmentId(id)
    setDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setDeleteApartmentId(null)
  }

  const confirmDelete = async () => {
    if (!deleteVictim) return
    try {
      await deleteApartment(deleteVictim.id)
      closeDeleteDialog()
    } catch {
      // toast côté contexte
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Admin · Appartements
        </h1>
        <p className="text-xs text-muted-foreground">
          Gérer la liste affichée sur le site — glissez-déposez les cartes pour
          l’ordre public (page d’accueil et carte).
        </p>
      </div>

      <div className={GRID_CLASS}>
        {apartments.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            autoScroll
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={itemIds} strategy={rectSortingStrategy}>
              <div className="contents">
                {apartments.map((apartment: Apartment) => (
                  <SortableAdminSlot
                    key={apartment.id}
                    apartment={apartment}
                    onEdit={() => openEdit(apartment.id)}
                    onDelete={() => setDeleteApartmentId(apartment.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : null}
        <AdminAddApartmentCard onAdd={openAdd} />
      </div>

      <AdminApartmentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
          else setDialogOpen(open)
        }}
        apartment={editingApartment}
      />

      <AdminDeleteConfirmDialog
        open={deleteApartmentId !== null}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog()
        }}
        apartment={deleteVictim}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
