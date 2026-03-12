import { Apartment } from "@/types/apartment"
import { Card, CardContent } from "@/components/ui/card"

type Props = {
  apartment: Apartment
}

export function ApartmentCard({ apartment }: Props) {
  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition">
      <img
        src={apartment.images[0]}
        alt={apartment.title}
        className="w-full h-48 object-cover"
      />

      <CardContent className="p-4">
        <h3 className="font-semibold">{apartment.title}</h3>

        <p className="text-sm text-muted-foreground">
          {apartment.beds} couchages • {apartment.bathrooms} salle de bain
        </p>
      </CardContent>
    </Card>
  )
}