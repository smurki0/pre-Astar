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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Mail,
  MailOpen,
  Eye,
  Trash2,
  Search,
  Clock,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { csrfFetch } from '@/lib/csrf-fetch'

interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  isRead: boolean
  createdAt: string
}

export function AdminContactMessages() {
  const { toast } = useToast()
  const [messages, setMessages] = React.useState<ContactMessage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedMessage, setSelectedMessage] = React.useState<ContactMessage | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'read' | 'unread'>('all')

  // Fetch messages
  const fetchMessages = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await csrfFetch('/api/admin/contact-messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الرسائل',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Filter messages
  const filteredMessages = React.useMemo(() => {
    return messages.filter((msg) => {
      const matchesSearch =
        msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.message.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'read' && msg.isRead) ||
        (statusFilter === 'unread' && !msg.isRead)
      return matchesSearch && matchesStatus
    })
  }, [messages, searchQuery, statusFilter])

  // Mark as read
  const handleMarkAsRead = async (message: ContactMessage) => {
    try {
      const response = await csrfFetch(`/api/admin/contact-messages/${message.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })
      
      if (response.ok) {
        setMessages(messages.map(m => 
          m.id === message.id ? { ...m, isRead: true } : m
        ))
        toast({
          title: 'تم التحديث',
          description: 'تم تحديد الرسالة كمقروءة',
        })
      }
    } catch (error) {
      // Handle error silently
    }
  }

  // Delete message
  const handleDelete = async (message: ContactMessage) => {
    try {
      const response = await csrfFetch(`/api/admin/contact-messages/${message.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setMessages(messages.filter(m => m.id !== message.id))
        setSelectedMessage(null)
        toast({
          title: 'تم الحذف',
          description: 'تم حذف الرسالة بنجاح',
        })
      }
    } catch (error) {
      // Handle error silently
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الرسالة',
        variant: 'destructive',
      })
    }
  }

  // Stats
  const stats = React.useMemo(() => {
    const total = messages.length
    const unread = messages.filter(m => !m.isRead).length
    const read = messages.filter(m => m.isRead).length
    return { total, unread, read }
  }, [messages])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">رسائل التواصل</h1>
        <p className="text-gray-500 text-sm mt-1">
          {stats.unread} رسالة غير مقروءة
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">إجمالي الرسائل</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Mail className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
                <p className="text-xs text-gray-500">غير مقروءة</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.read}</p>
                <p className="text-xs text-gray-500">مقروءة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="بحث في الرسائل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                الكل
              </Button>
              <Button
                variant={statusFilter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('unread')}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                غير مقروءة
              </Button>
              <Button
                variant={statusFilter === 'read' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('read')}
                className="gap-2"
              >
                <MailOpen className="h-4 w-4" />
                مقروءة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-gray-400" />
              <p className="text-gray-500 mt-4">لا توجد رسائل</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>المرسل</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow 
                    key={message.id} 
                    className={cn(
                      'hover:bg-gray-50 cursor-pointer',
                      !message.isRead && 'bg-amber-50/50'
                    )}
                    onClick={() => {
                      setSelectedMessage(message)
                      if (!message.isRead) {
                        handleMarkAsRead(message)
                      }
                    }}
                  >
                    <TableCell>
                      <div className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center',
                        message.isRead ? 'bg-gray-100' : 'bg-primary/20'
                      )}>
                        <User className={cn(
                          'h-5 w-5',
                          message.isRead ? 'text-gray-500' : 'text-primary'
                        )} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{message.name}</p>
                        <p className="text-sm text-gray-500">{message.email}</p>
                        {message.phone && (
                          <p className="text-xs text-gray-400">{message.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {message.subject || 'بدون موضوع'}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(message.createdAt).toLocaleDateString('ar-SA')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {message.isRead ? (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          مقروءة
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">
                          <XCircle className="h-3 w-3 mr-1" />
                          جديدة
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedMessage(message)
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(message)
                          }}
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

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل الرسالة</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedMessage.name}</p>
                  <p className="text-sm text-gray-500">{selectedMessage.email}</p>
                </div>
              </div>
              {selectedMessage.phone && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">الهاتف:</span> {selectedMessage.phone}
                </div>
              )}
              {selectedMessage.subject && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">الموضوع:</span> {selectedMessage.subject}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-700 mb-2">الرسالة:</p>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {new Date(selectedMessage.createdAt).toLocaleString('ar-SA')}
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    window.location.href = `mailto:${selectedMessage.email}`
                  }}
                >
                  <Mail className="h-4 w-4 ml-2" />
                  رد بالإيميل
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedMessage)}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminContactMessages
