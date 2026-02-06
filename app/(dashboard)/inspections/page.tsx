import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Scan } from "lucide-react"

export default function InspectionsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kiểm tra tài sản</h1>
        <Button>
          <Scan className="w-4 h-4 mr-2" />
          Quét QR
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách cần kiểm tra</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Không có tài sản nào cần kiểm tra.</p>
        </CardContent>
      </Card>
    </div>
  )
}
