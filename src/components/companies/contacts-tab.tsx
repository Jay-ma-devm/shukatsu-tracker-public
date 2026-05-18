"use client"

import { useState } from "react"
import { Plus, Trash2, Star, Mail, Phone, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Contact } from "@/types"
import { cn } from "@/lib/utils"

type ContactWithMeetings = Contact & { _count?: { meetings?: number } }

interface ContactsTabProps {
  companyId: string
  initialContacts: ContactWithMeetings[]
}

export function ContactsTab({ companyId, initialContacts }: ContactsTabProps) {
  const [contacts, setContacts] = useState<ContactWithMeetings[]>(initialContacts)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", role: "", email: "", phone: "", notes: "", linkedIn: "", important: false })
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch(`/api/companies/${companyId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const contact = await res.json()
      setContacts((prev) => [...prev, contact])
      setForm({ name: "", role: "", email: "", phone: "", notes: "", linkedIn: "", important: false })
      setShowForm(false)
      toast.success("連絡先を追加しました")
    }
    setSaving(false)
  }

  const handleEdit = async () => {
    if (!editingId || !form.name.trim()) return
    setSaving(true)
    const res = await fetch(`/api/companies/${companyId}/contacts/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const updated = await res.json()
      setContacts((prev) => prev.map((c) => c.id === editingId ? updated : c))
      setEditingId(null)
      setShowForm(false)
      setForm({ name: "", role: "", email: "", phone: "", notes: "", linkedIn: "", important: false })
      toast.success("連絡先を更新しました")
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/companies/${companyId}/contacts/${id}`, { method: "DELETE" })
    if (res.ok) {
      setContacts((prev) => prev.filter((c) => c.id !== id))
      toast.success("削除しました")
    }
  }

  const handleToggleImportant = async (contact: Contact) => {
    const res = await fetch(`/api/companies/${companyId}/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ important: !contact.important }),
    })
    if (res.ok) {
      setContacts((prev) => prev.map((c) => c.id === contact.id ? { ...c, important: !c.important } : c))
    }
  }

  return (
    <div className="space-y-2">
      {contacts.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground text-center py-6">連絡先はまだありません</p>
      ) : (
        contacts.map((contact) => (
          <div key={contact.id} className={cn(
            "group flex items-start gap-3 p-3 border rounded-xl",
            contact.important && "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20"
          )}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">{contact.name}</p>
                {contact.important && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
              </div>
              {contact.role && <p className="text-xs text-muted-foreground">{contact.role}</p>}
              <div className="flex flex-wrap gap-3 mt-1">
                {contact.email && (
                  <div className="flex items-center gap-1">
                    <a href={`mailto:${contact.email}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Mail className="h-3 w-3" />{contact.email}
                    </a>
                    <button
                      onClick={() => { navigator.clipboard.writeText(contact.email!); }}
                      className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                      title="メールアドレスをコピー"
                    >
                      📋
                    </button>
                  </div>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />{contact.phone}
                  </a>
                )}
                {(contact as { linkedIn?: string }).linkedIn && (
                  <a href={(contact as { linkedIn?: string }).linkedIn!} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    LinkedIn
                  </a>
                )}
              </div>
              {contact.notes && <p className="text-xs text-muted-foreground mt-1">{contact.notes}</p>}
              {(contact._count?.meetings ?? 0) > 0 && (
                <a
                  href={`/meetings?contact=${contact.id}`}
                  className="text-[10px] bg-teal-100 text-teal-700 hover:bg-teal-200 px-1.5 py-0.5 rounded-full mt-1 inline-block transition-colors"
                >
                  OB訪問 {contact._count!.meetings}回 →
                </a>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon-sm" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleToggleImportant(contact)}>
                <Star className={cn("h-3 w-3", contact.important && "text-amber-400 fill-amber-400")} />
              </Button>
              <Button variant="ghost" size="icon-sm" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => {
                setEditingId(contact.id)
                setForm({ name: contact.name, role: contact.role ?? "", email: contact.email ?? "", phone: contact.phone ?? "", notes: contact.notes ?? "", linkedIn: (contact as { linkedIn?: string }).linkedIn ?? "", important: contact.important })
                setShowForm(true)
              }}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon-sm" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => handleDelete(contact.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))
      )}

      {showForm ? (
        <div className="p-3 border rounded-xl border-dashed space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">名前 *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="田中 太郎" className="h-7 text-sm" autoFocus />
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Label className="text-xs">役職・関係</Label>
                {["採用担当", "OB", "面接官", "マネージャー"].map((r) => (
                  <button key={r} type="button" onClick={() => setForm((f) => ({ ...f, role: r }))}
                    className="text-[9px] px-1.5 py-0.5 bg-muted hover:bg-muted/80 rounded text-muted-foreground transition-colors">
                    {r}
                  </button>
                ))}
              </div>
              <Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="リクルーター / 面接官 / OB" className="h-7 text-sm" />
            </div>
            <div>
              <Label className="text-xs">メール</Label>
              <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} type="email" placeholder="example@company.com" className="h-7 text-sm" />
            </div>
            <div>
              <Label className="text-xs">電話</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="090-xxxx-xxxx" className="h-7 text-sm" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">LinkedIn URL</Label>
              <Input value={form.linkedIn} onChange={(e) => setForm((f) => ({ ...f, linkedIn: e.target.value }))} placeholder="https://linkedin.com/in/..." className="h-7 text-sm" type="url" />
            </div>
          </div>
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null); setForm({ name: "", role: "", email: "", phone: "", notes: "", linkedIn: "", important: false }) }}>キャンセル</Button>
            <Button size="sm" onClick={editingId ? handleEdit : handleAdd} disabled={saving || !form.name.trim()}>
              {editingId ? "更新" : "追加"}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="w-full border-dashed gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          連絡先を追加
        </Button>
      )}
    </div>
  )
}
