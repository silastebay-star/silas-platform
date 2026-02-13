/**
 * Advanced File Manager Component
 * Document organization, version control, and collaborative editing features
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  File, 
  Folder,
  FolderOpen,
  Upload,
  Download,
  Share,
  Edit,
  Trash2,
  Copy,
  Move,
  Search,
  Filter,
  Grid,
  List,
  Clock,
  Users,
  Lock,
  Unlock,
  Star,
  Tag,
  History,
  GitBranch,
  Eye,
  EyeOff,
  Plus,
  MoreHorizontal,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Info
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface FileItem {
  id: string
  name: string
  type: 'file' | 'folder'
  size: number
  mime_type?: string
  path: string
  parent_id?: string
  created_at: string
  updated_at: string
  created_by: {
    id: string
    name: string
    avatar_url?: string
  }
  permissions: {
    can_read: boolean
    can_write: boolean
    can_delete: boolean
    can_share: boolean
  }
  metadata: {
    description?: string
    tags: string[]
    is_starred: boolean
    is_public: boolean
    version: number
    checksum?: string
  }
  versions?: FileVersion[]
  collaborators?: Collaborator[]
  activity?: ActivityItem[]
}

interface FileVersion {
  id: string
  version: number
  size: number
  created_at: string
  created_by: {
    id: string
    name: string
  }
  changes: string
  is_current: boolean
}

interface Collaborator {
  id: string
  user_id: string
  name: string
  avatar_url?: string
  permission: 'read' | 'write' | 'admin'
  added_at: string
}

interface ActivityItem {
  id: string
  action: 'created' | 'updated' | 'deleted' | 'shared' | 'moved' | 'renamed'
  user: {
    id: string
    name: string
  }
  timestamp: string
  details?: string
}

interface AdvancedFileManagerProps {
  pinId?: string
  projectId?: string
  className?: string
}

export default function AdvancedFileManager({ 
  pinId, 
  projectId,
  className 
}: AdvancedFileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [showVersions, setShowVersions] = useState(false)
  const [showSharing, setShowSharing] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [currentPath, pinId, projectId])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const pathParam = currentPath.length > 0 ? `&path=${currentPath.join('/')}` : ''
      const contextParam = pinId ? `pin_id=${pinId}` : projectId ? `project_id=${projectId}` : ''
      
      const response = await fetch(`/api/files?${contextParam}${pathParam}`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('path', currentPath.join('/'))
        if (pinId) formData.append('pin_id', pinId)
        if (projectId) formData.append('project_id', projectId)

        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }
      }
      
      await fetchFiles()
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setUploading(false)
    }
  }, [currentPath, pinId, projectId])

  const createFolder = async (name: string) => {
    try {
      const response = await fetch('/api/files/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          path: currentPath.join('/'),
          pin_id: pinId,
          project_id: projectId
        })
      })

      if (response.ok) {
        await fetchFiles()
      }
    } catch (error) {
      console.error('Error creating folder:', error)
    }
  }

  const deleteFiles = async (fileIds: string[]) => {
    try {
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_ids: fileIds })
      })

      if (response.ok) {
        setSelectedFiles([])
        await fetchFiles()
      }
    } catch (error) {
      console.error('Error deleting files:', error)
    }
  }

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return <Folder className="w-5 h-5 text-blue-600" />
    }

    const mimeType = file.mime_type || ''
    if (mimeType.startsWith('image/')) return <FileImage className="w-5 h-5 text-green-600" />
    if (mimeType.startsWith('video/')) return <FileVideo className="w-5 h-5 text-purple-600" />
    if (mimeType.startsWith('audio/')) return <FileAudio className="w-5 h-5 text-orange-600" />
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-red-600" />
    if (mimeType.includes('zip') || mimeType.includes('archive')) return <Archive className="w-5 h-5 text-gray-600" />
    
    return <File className="w-5 h-5 text-gray-600" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const navigateToFolder = (folderName: string) => {
    setCurrentPath(prev => [...prev, folderName])
  }

  const navigateUp = () => {
    setCurrentPath(prev => prev.slice(0, -1))
  }

  const filteredAndSortedFiles = files
    .filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-silas-green" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <File className="w-5 h-5 text-silas-green" />
                <span>Advanced File Manager</span>
              </CardTitle>
              <CardDescription>
                Organize documents with version control and collaborative editing
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={fetchFiles}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Navigation */}
            <div className="flex items-center space-x-2 flex-1">
              <Button variant="outline" size="sm" onClick={navigateUp} disabled={currentPath.length === 0}>
                ↑ Up
              </Button>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <span>Home</span>
                {currentPath.map((folder, index) => (
                  <span key={index}>
                    / <button 
                      onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                      className="hover:text-silas-green"
                    >
                      {folder}
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button asChild size="sm" className="bg-silas-green hover:bg-silas-green/90">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </label>
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => createFolder('New Folder')}>
                <Plus className="w-4 h-4 mr-2" />
                Folder
              </Button>

              {selectedFiles.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={() => deleteFiles(selectedFiles)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedFiles.length})
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Search and View Controls */}
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
              
              <div className="flex border rounded">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-r-none"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File List/Grid */}
      <Card>
        <CardContent className="p-0">
          {viewMode === 'list' ? (
            <div className="divide-y">
              {filteredAndSortedFiles.map(file => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center p-4 hover:bg-gray-50 cursor-pointer",
                    selectedFiles.includes(file.id) && "bg-blue-50"
                  )}
                  onClick={() => {
                    if (file.type === 'folder') {
                      navigateToFolder(file.name)
                    } else {
                      setSelectedFile(file)
                    }
                  }}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        if (e.target.checked) {
                          setSelectedFiles(prev => [...prev, file.id])
                        } else {
                          setSelectedFiles(prev => prev.filter(id => id !== file.id))
                        }
                      }}
                      className="rounded"
                    />
                    
                    {getFileIcon(file)}
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{file.name}</span>
                        {file.metadata.is_starred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        {file.metadata.is_public && <Unlock className="w-4 h-4 text-green-500" />}
                        {file.metadata.version > 1 && (
                          <Badge variant="outline" className="text-xs">
                            v{file.metadata.version}
                          </Badge>
                        )}
                      </div>
                      {file.metadata.description && (
                        <p className="text-sm text-gray-600 mt-1">{file.metadata.description}</p>
                      )}
                      {file.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {file.metadata.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{file.type === 'file' ? formatFileSize(file.size) : '—'}</span>
                    <span>{format(new Date(file.updated_at), 'MMM d, yyyy')}</span>
                    <span>{file.created_by.name}</span>
                    
                    <div className="flex items-center space-x-1">
                      {file.collaborators && file.collaborators.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{file.collaborators.length}</span>
                        </div>
                      )}
                      
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredAndSortedFiles.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <File className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No files found</p>
                  <p className="text-sm">
                    {searchQuery ? 'Try adjusting your search' : 'Upload files to get started'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
              {filteredAndSortedFiles.map(file => (
                <div
                  key={file.id}
                  className={cn(
                    "p-4 border rounded-lg hover:shadow-md cursor-pointer transition-shadow",
                    selectedFiles.includes(file.id) && "border-blue-500 bg-blue-50"
                  )}
                  onClick={() => {
                    if (file.type === 'folder') {
                      navigateToFolder(file.name)
                    } else {
                      setSelectedFile(file)
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="mb-2 flex justify-center">
                      {getFileIcon(file)}
                    </div>
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    {file.type === 'file' && (
                      <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Details Panel */}
      {selectedFile && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                {getFileIcon(selectedFile)}
                <span>{selectedFile.name}</span>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="versions">Versions</TabsTrigger>
                <TabsTrigger value="sharing">Sharing</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Size</Label>
                    <p>{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <p>{selectedFile.mime_type || 'Unknown'}</p>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p>{format(new Date(selectedFile.created_at), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <Label>Modified</Label>
                    <p>{format(new Date(selectedFile.updated_at), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                </div>

                {selectedFile.metadata.description && (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-gray-600">{selectedFile.metadata.description}</p>
                  </div>
                )}

                {selectedFile.metadata.tags.length > 0 && (
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedFile.metadata.tags.map(tag => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="versions" className="space-y-4">
                {selectedFile.versions?.map(version => (
                  <div key={version.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Version {version.version}</span>
                        {version.is_current && <Badge>Current</Badge>}
                      </div>
                      <p className="text-sm text-gray-600">{version.changes}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(version.created_at), 'MMM d, yyyy HH:mm')} by {version.created_by.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{formatFileSize(version.size)}</span>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500">No version history available</p>
                )}
              </TabsContent>

              <TabsContent value="sharing" className="space-y-4">
                <div className="space-y-3">
                  {selectedFile.collaborators?.map(collaborator => (
                    <div key={collaborator.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                        <div>
                          <p className="font-medium">{collaborator.name}</p>
                          <p className="text-sm text-gray-500">{collaborator.permission}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Change
                      </Button>
                    </div>
                  )) || (
                    <p className="text-gray-500">No collaborators</p>
                  )}
                </div>
                
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Collaborator
                </Button>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                {selectedFile.activity?.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-silas-green rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span> {activity.action} this file
                      </p>
                      {activity.details && (
                        <p className="text-sm text-gray-600">{activity.details}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500">No activity history</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-silas-green" />
              <span>Uploading files...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
