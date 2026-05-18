'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, MessageSquare, Send } from 'lucide-react'

interface Conversation {
  id: string
  lead: {
    firstName: string | null
    lastName: string | null
    title: string | null
    company: string | null
    linkedinProfileUrl: string | null
  }
  linkedinAccount: {
    name: string
  }
  lastMessage: string | null
  lastMessageAt: string | null
  isRead: boolean
  status: string
  createdAt: string
}

interface Workspace {
  id: string
  name: string
}

export default function UniboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const res = await fetch('/api/workspaces')
      const data = await res.json()
      setWorkspaces(data || [])
      if (data?.length > 0) {
        setSelectedWorkspace(data[0].id)
      }
    }
    fetchWorkspaces()
  }, [])

  useEffect(() => {
    if (!selectedWorkspace) return

    const fetchConversations = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/workspaces/${selectedWorkspace}/unibox/conversations`)
        const data = await res.json()
        setConversations(data || [])
      } catch (error) {
        console.error('Error fetching conversations:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchConversations()
  }, [selectedWorkspace])

  const formatTime = (date: string | null) => {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-heading">Unibox</h1>
          <p className="text-muted mt-1">All your LinkedIn conversations in one place</p>
        </div>
        <select
          value={selectedWorkspace}
          onChange={(e) => setSelectedWorkspace(e.target.value)}
          className="px-3 py-2 rounded-lg bg-navy-light border border-border text-white"
        >
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="bg-navy-light border-border">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input placeholder="Search conversations..." className="pl-10 bg-navy border-border" />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-secondary/50 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-secondary/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {conv.lead.firstName} {conv.lead.lastName}
                        </p>
                        <p className="text-muted text-sm truncate">
                          {conv.lead.title} at {conv.lead.company}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                        {!conv.isRead && (
                          <span className="w-2 h-2 rounded-full bg-accent" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted truncate mt-1">
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation Detail */}
        <Card className="bg-navy-light border-border lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">
                      {selectedConversation.lead.firstName} {selectedConversation.lead.lastName}
                    </CardTitle>
                    <p className="text-muted text-sm">
                      {selectedConversation.lead.title} at {selectedConversation.lead.company}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-border">
                    {selectedConversation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col h-[calc(100%-80px)]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="text-center text-muted text-sm">
                    Start the conversation by sending a message
                  </div>
                </div>
                <div className="border-t border-border p-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Type your message..."
                      className="bg-navy border-border"
                    />
                    <Button>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}