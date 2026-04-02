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
import { X } from "lucide-react"

import type { HoverSource } from "@/types/hover"
import type { Apartment, DialogAnchorRect } from "@/types/apartments"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ApartmentCard } from "./apartment-card"
import { useApartments } from "./apartments-context"
import { AdminAddApartmentCard } from "./admin-add-apartment-card"
import { AdminApartmentDialog } from "./admin-apartment-dialog"
import { AdminDeleteConfirmDialog } from "./admin-delete-confirm-dialog"
import { ApartmentDialog } from "./apartment-dialog"

type ApartmentGridProps = {
  apartments: Apartment[]
  adminMode: boolean
  adminReorderEnabled: boolean
  selectedApartmentId: string | null
  dialogApartmentId: string | null
  dialogAnchorRect: DialogAnchorRect | null
  setSelectedApartmentId: (id: string | null) => void
  openApartmentDialog: (id: string | null, anchor?: DialogAnchorRect | null) => void
  hoveredApartmentId: string | null
  setHoveredApartmentId: (id: string | null) => void
  hoverSource: HoverSource
  setHoverSource: (source: HoverSource) => void
  hoverLock: boolean
  onResetFilters: () => void
}

type ApartmentListSlotProps = {
  apartment: Apartment
  index: number
  adminMode: boolean
  selectedApartmentId: string | null
  hoveredApartmentId: string | null
  hoverSource: HoverSource
  hoverLock: boolean
  setSelectedApartmentId: (id: string | null) => void
  setHoveredApartmentId: (id: string | null) => void
  setHoverSource: (source: HoverSource) => void
  onEdit: () => void
  onDelete: () => void
}

function ApartmentCardShell({
  apartment,
  index,
  adminMode,
  selectedApartmentId,
  hoveredApartmentId,
  hoverSource,
  hoverLock,
  setSelectedApartmentId,
  setHoveredApartmentId,
  setHoverSource,
  onEdit,
  onDelete,
}: ApartmentListSlotProps) {
  return (
    <div
      className="h-full min-h-0 min-w-0"
      onMouseEnter={() => {
        setSelectedApartmentId(apartment.id)
        if (!hoverLock) {
          setHoverSource("list")
          setHoveredApartmentId(apartment.id)
        }
      }}
      onMouseLeave={() => {
        setSelectedApartmentId(null)
        if (!hoverLock) {
          setHoverSource(null)
          setHoveredApartmentId(null)
        }
      }}
    >
      <div className={cn("h-full", adminMode && "pb-3 pt-7 pr-3")}>
        <ApartmentCard
          apartment={apartment}
          priority={index === 0}
          selectedApartmentId={selectedApartmentId}
          hoveredApartmentId={hoveredApartmentId}
          hoverSource={hoverSource}
          layout="desktopSplit"
          titleIdPrefix={adminMode ? "admin-apt-card-title" : "apt-card-title"}
          overlaySlot={
            adminMode ? (
              <button
                type="button"
                aria-label="Supprimer cet appartement"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="absolute right-0 top-0 z-30 inline-flex h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black/14 bg-white/86 text-neutral-900 shadow-[0_4px_14px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-200 ease-out hover:border-red-500/40 hover:bg-red-500/88 hover:text-white hover:shadow-[0_6px_22px_rgba(0,0,0,0.18),0_3px_10px_rgba(220,38,38,0.3)] active:scale-[0.96] focus-visible:border-red-500/40 focus-visible:bg-red-500/88 focus-visible:outline-none focus-visible:text-white focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:shadow-[0_6px_22px_rgba(0,0,0,0.16),0_3px_10px_rgba(220,38,38,0.22)] dark:border-white/22 dark:bg-black/62 dark:text-white dark:hover:border-red-400/45 dark:hover:bg-red-500/82 dark:hover:text-white dark:focus-visible:border-red-400/45 dark:focus-visible:bg-red-500/82 dark:focus-visible:ring-red-400/48"
              >
                <X
                  className="size-5 shrink-0 transition-colors duration-200 ease-out"
                  aria-hidden
                  strokeWidth={2}
                />
              </button>
            ) : null
          }
          footerSlot={
            adminMode ? (
              <Button
                type="button"
                variant="default"
                size="sm"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onEdit}
                className="w-full rounded-lg border border-orange-500/20 bg-orange-500/15 text-orange-600 shadow-sm hover:bg-orange-500/20 active:scale-[0.99] dark:text-orange-300 dark:hover:bg-orange-500/20"
              >
                Modifier
              </Button>
            ) : null
          }
        />
      </div>
    </div>
  )
}

function DraggableApartmentListSlot(props: ApartmentListSlotProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.apartment.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "min-h-0 min-w-0 cursor-grab touch-manipulation active:cursor-grabbing",
        isDragging && "relative z-10 opacity-95",
      )}
      {...attributes}
      {...listeners}
    >
      <ApartmentCardShell {...props} />
    </div>
  )
}

export function ApartmentGrid({
  apartments,
  adminMode,
  adminReorderEnabled,
  selectedApartmentId,
  dialogApartmentId,
  dialogAnchorRect,
  setSelectedApartmentId,
  openApartmentDialog,
  hoveredApartmentId,
  setHoveredApartmentId,
  hoverSource,
  setHoverSource,
  hoverLock,
  onResetFilters,
}: ApartmentGridProps) {
  const { reorderApartments, deleteApartment } = useApartments()
  const dialogApartment = useMemo(
    () => apartments.find((a) => a.id === dialogApartmentId) ?? null,
    [apartments, dialogApartmentId],
  )
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingApartmentId, setEditingApartmentId] = useState<string | null>(
    null,
  )
  const [deleteApartmentId, setDeleteApartmentId] = useState<string | null>(
    null,
  )

  const editingApartment = useMemo(
    () => apartments.find((a) => a.id === editingApartmentId) ?? null,
    [apartments, editingApartmentId],
  )
  const deleteVictim = useMemo(
    () => apartments.find((a) => a.id === deleteApartmentId) ?? null,
    [apartments, deleteApartmentId],
  )
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
    reorderApartments(reordered.map((a, i) => ({ id: a.id, position: i })))
  }

  const closeAdminEditor = () => {
    setEditorOpen(false)
    setEditingApartmentId(null)
  }

  const confirmDelete = async () => {
    if (!deleteVictim) return
    try {
      await deleteApartment(deleteVictim.id)
      setDeleteApartmentId(null)
    } catch {
      // toast déjà géré par le contexte
    }
  }

  if (apartments.length === 0 && !adminMode) {
    return (
      <div
        className="flex animate-in fade-in-0 zoom-in-95 flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border/70 bg-muted/25 px-6 py-14 text-center duration-300"
        role="status"
      >
        <p className="max-w-sm text-base font-medium text-foreground">
          Aucun appartement ne correspond à votre recherche
        </p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Élargissez les critères ou réinitialisez les filtres.
        </p>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onResetFilters}
          className="rounded-xl"
        >
          Réinitialiser les filtres
        </Button>
      </div>
    )
  }

  return (
    <>
      {dialogApartment ? (
        <ApartmentDialog
          key={dialogApartment.id}
          apartment={dialogApartment}
          open
          anchorRect={dialogAnchorRect}
          onOpenChange={(open) => {
            if (!open) openApartmentDialog(null)
          }}
        />
      ) : null}
      {adminMode ? (
        <AdminApartmentDialog
          open={editorOpen}
          onOpenChange={(open) => {
            if (!open) closeAdminEditor()
            else setEditorOpen(open)
          }}
          apartment={editingApartment}
        />
      ) : null}
      {adminMode ? (
        <AdminDeleteConfirmDialog
          open={deleteApartmentId !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteApartmentId(null)
          }}
          apartment={deleteVictim}
          onConfirm={confirmDelete}
        />
      ) : null}
      {adminMode && !adminReorderEnabled ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/8 px-4 py-3 text-sm text-muted-foreground">
          <p>
            Le drag-and-drop est disponible quand les filtres sont réinitialisés
            et que le tri par défaut est actif.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="shrink-0 rounded-xl"
          >
            Réinitialiser
          </Button>
        </div>
      ) : null}
      {adminMode && adminReorderEnabled ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          autoScroll
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={itemIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-1 lg:gap-4">
              {apartments.map((apartment: Apartment, index: number) => (
                <DraggableApartmentListSlot
                  key={apartment.id}
                  apartment={apartment}
                  index={index}
                  adminMode
                  selectedApartmentId={selectedApartmentId}
                  hoveredApartmentId={hoveredApartmentId}
                  hoverSource={hoverSource}
                  hoverLock={hoverLock}
                  setSelectedApartmentId={setSelectedApartmentId}
                  setHoveredApartmentId={setHoveredApartmentId}
                  setHoverSource={setHoverSource}
                  onEdit={() => {
                    setEditingApartmentId(apartment.id)
                    setEditorOpen(true)
                  }}
                  onDelete={() => setDeleteApartmentId(apartment.id)}
                />
              ))}
              <AdminAddApartmentCard
                onAdd={() => {
                  setEditingApartmentId(null)
                  setEditorOpen(true)
                }}
              />
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-1 lg:gap-4">
          {apartments.length === 0 && adminMode ? (
            <div
              className="flex animate-in fade-in-0 zoom-in-95 flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border/70 bg-muted/25 px-6 py-14 text-center duration-300"
              role="status"
            >
              <p className="max-w-sm text-base font-medium text-foreground">
                Aucun appartement ne correspond à votre recherche
              </p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Réinitialisez les filtres ou ajoutez un nouvel appartement.
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={onResetFilters}
                className="rounded-xl"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : null}
          {apartments.map((apartment: Apartment, index: number) => (
            <ApartmentCardShell
              key={apartment.id}
              apartment={apartment}
              index={index}
              adminMode={adminMode}
              selectedApartmentId={selectedApartmentId}
              hoveredApartmentId={hoveredApartmentId}
              hoverSource={hoverSource}
              hoverLock={hoverLock}
              setSelectedApartmentId={setSelectedApartmentId}
              setHoveredApartmentId={setHoveredApartmentId}
              setHoverSource={setHoverSource}
              onEdit={() => {
                setEditingApartmentId(apartment.id)
                setEditorOpen(true)
              }}
              onDelete={() => setDeleteApartmentId(apartment.id)}
            />
          ))}
          {adminMode ? (
            <AdminAddApartmentCard
              onAdd={() => {
                setEditingApartmentId(null)
                setEditorOpen(true)
              }}
            />
          ) : null}
        </div>
      )}
    </>
  )
}
