'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Mail,
  MailOpen,
  Trash2,
  Search,
  Download,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { csrfFetch } from '@/lib/csrf-fetch'

interface Subscriber {
  id: string
  email: string
  active: boolean
  createdAt: string
}

export function AdminNewsletter() {
  const { toast } = useToast()
  const [subscribers, setSubscribers] = React.useState<Subscriber[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [deleteDialog, setDeleteDialog] = React.useState<Subscriber | null>(null)

  // Fetch subscribers
  const fetchSubscribers = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await csrfFetch('/api/admin/newsletter')
      if (response.ok) {
        const data = await response.json()
        setSubscribers(data.subscribers || [])
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل المشتركين',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  // Filter subscribers
  const filteredSubscribers = React.useMemo(() => {
    return subscribers.filter((sub) =>
      sub.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [subscribers, searchQuery])

  // Stats
  const stats = React.useMemo(() => {
    const total = subscribers.length
    const active = subscribers.filter(s => s.active).length
    return { total, active }
  }, [subscribers])

  // Select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredSubscribers.map(s => s.id))
    } else {
      setSelectedIds([])
    }
  }

  // Select one
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(i => i !== id))
    }
  }

  // Delete subscriber
  const handleDelete = async (subscriber: Subscriber) => {
    try {
      const response = await csrfFetch(`/api/admin/newsletter/${subscriber.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setSubscribers(subscribers.filter(s => s.id !== subscriber.id))
        setDeleteDialog(null)
        toast({
          title: 'تم الحذف',
          description: 'تم حذف المشترك بنجاح',
        })
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في حذف المشترك',
        variant: 'destructive',
      })
    }
  }

  // Export emails
  const handleExport = () => {
    const emails = filteredSubscribers.map(s => s.email).join('\n')
    const blob = new Blob([emails], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subscribers.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">النشرة البريدية</h1>
          <p className="text-gray-500 text-sm mt-1">
            {stats.active} مشترك نشط
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          تصدير البريد الإلكتروني
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">إجمالي المشتركين</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <MailOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-xs text-gray-500">مشتركين نشطين</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="بحث في البريد الإلكتروني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscribers Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ))}
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-gray-400" />
              <p className="text-gray-500 mt-4">لا يوجد مشتركين</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4"
                    />
                  </TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الاشتراك</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(subscriber.id)}
                        onChange={(e) => handleSelectOne(subscriber.id, e.target.checked)}
                        className="h-4 w-4"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {subscriber.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        'font-normal',
                        subscriber.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      )}>
                        {subscriber.active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(subscriber.createdAt).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialog(subscriber)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المشترك</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف "{deleteDialog?.email}" من قائمة المشتركين؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default AdminNewsletter
