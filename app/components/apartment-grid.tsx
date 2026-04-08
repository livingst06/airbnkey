"use client"

import dynamic from "next/dynamic"
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

import type { HoverSource } from "@/types/hover"
import type { Apartment, DialogAnchorRect } from "@/types/apartments"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useApartments } from "./apartments-context"
import { ApartmentCardPublic } from "./apartment-card-public"
import { ApartmentDialog } from "./apartment-dialog"

const AdminAddApartmentCard = dynamic(() =>
  import("./admin-add-apartment-card").then((mod) => mod.AdminAddApartmentCard),
)
const ApartmentCardAdmin = dynamic(() =>
  import("./apartment-card-admin").then((mod) => mod.ApartmentCardAdmin),
)
const AdminApartmentDialog = dynamic(() =>
  import("./admin-apartment-dialog").then((mod) => mod.AdminApartmentDialog),
)
const AdminDeleteConfirmDialog = dynamic(() =>
  import("./admin-delete-confirm-dialog").then(
    (mod) => mod.AdminDeleteConfirmDialog,
  ),
)

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

function canUseMapGridSync() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false
  }
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches
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
        if (!canUseMapGridSync()) return
        setSelectedApartmentId(apartment.id)
        if (!hoverLock) {
          setHoverSource("list")
          setHoveredApartmentId(apartment.id)
        }
      }}
      onMouseLeave={() => {
        if (!canUseMapGridSync()) return
        setSelectedApartmentId(null)
        if (!hoverLock) {
          setHoverSource(null)
          setHoveredApartmentId(null)
        }
      }}
    >
      <div className="h-full">
        {adminMode ? (
          <ApartmentCardAdmin
            apartment={apartment}
            index={index}
            selectedApartmentId={selectedApartmentId}
            hoveredApartmentId={hoveredApartmentId}
            hoverSource={hoverSource}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ) : (
          <ApartmentCardPublic
            apartment={apartment}
            index={index}
            selectedApartmentId={selectedApartmentId}
            hoveredApartmentId={hoveredApartmentId}
            hoverSource={hoverSource}
          />
        )}
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
          open={deleteApartmentId !== null && deleteVictim !== null}
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
