"use client"

import { useMemo, useState } from "react"

import type { Apartment } from "@/types/apartments"

import { useApartments } from "./apartments-context"
import { AdminAddApartmentCard } from "./admin-add-apartment-card"
import { ApartmentCardAdmin } from "./apartment-card-admin"
import { AdminApartmentDialog } from "./admin-apartment-dialog"
import { AdminDeleteConfirmDialog } from "./admin-delete-confirm-dialog"

export function AdminPanel() {
  const { apartments, deleteApartment: deleteApartmentById } = useApartments()

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

  const confirmDelete = () => {
    if (!deleteVictim) return
    deleteApartmentById(deleteVictim.id)
    closeDeleteDialog()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          Admin · Appartements
        </h1>
        <p className="text-xs text-muted-foreground">
          Gérer la liste affichée sur le site
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {apartments.map((apartment: Apartment) => (
          <ApartmentCardAdmin
            key={apartment.id}
            apartment={apartment}
            onEdit={() => openEdit(apartment.id)}
            onDelete={() => setDeleteApartmentId(apartment.id)}
          />
        ))}
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

