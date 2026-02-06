import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"

export default function ContractsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Danh sách hợp đồng</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Tạo hợp đồng
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hợp đồng</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chưa có hợp đồng nào.</p>
        </CardContent>
      </Card>
    </div>
  )
}
