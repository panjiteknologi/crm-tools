"use client";

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  NodeTypes,
  MiniMap,
  Handle,
  Position,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { KolaborasiCrmDialog } from '@/components/kolaborasi-crm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, HelpCircle, Trash2, Pencil, Trash, StickyNote, ArrowRightLeft, ArrowRight, ArrowLeft, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// Note Node Component - For custom text boxes/notes
const NoteNode = ({ data, selected }: { data: any; selected?: boolean }) => {
  return (
    <div className={`bg-purple-50 dark:bg-purple-900/20 rounded-xl shadow-2xl border-2 min-w-[200px] max-w-[500px] w-auto transition-colors relative ${
      selected
        ? 'border-purple-600 dark:border-purple-400 ring-4 ring-purple-300 dark:ring-purple-700'
        : 'border-purple-300 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500'
    }`}>
      {/* Handles for connecting */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white rounded-full hover:!scale-150 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white rounded-full hover:!scale-150 transition-transform"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white rounded-full hover:!scale-150 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white rounded-full hover:!scale-150 transition-transform"
      />

      {/* Action buttons - top right */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <button
          onClick={data.onEdit}
          className="w-6 h-6 bg-purple-400 hover:bg-purple-500 text-white rounded-md flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-110 opacity-70 hover:opacity-100"
          title="Edit"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={data.onDelete}
          className="w-6 h-6 bg-red-400 hover:bg-red-500 text-white rounded-md flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-110 opacity-70 hover:opacity-100"
          title="Hapus"
        >
          <Trash className="w-3 h-3" />
        </button>
      </div>

      {/* Note Content - hanya isi note */}
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
        <div
          className="text-sm text-slate-900 dark:text-white jobdesk-content leading-relaxed"
          dangerouslySetInnerHTML={{ __html: data.content || '' }}
        />
      </div>
    </div>
  );
};

// Custom Node Component - Matching the design from struktur-divisi-crp page
const StaffNode = ({ data, selected }: { data: any; selected?: boolean }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 w-72 transition-colors relative ${
      selected
        ? 'border-purple-600 dark:border-purple-400 ring-4 ring-purple-300 dark:ring-purple-700 scale-105'
        : 'border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500'
    }`}>
      {/* Invisible handles for connecting - small purple dots */}
      {/* Top - Can receive connections */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white rounded-full hover:!scale-150 transition-transform"
      />

      {/* Bottom - Can start connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white rounded-full hover:!scale-150 transition-transform"
      />

      {/* Left - Can receive connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white rounded-full hover:!scale-150 transition-transform"
      />

      {/* Right - Can start connections */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white rounded-full hover:!scale-150 transition-transform"
      />

      {/* Card Header - Gradient Background */}
      <div className={`bg-gradient-to-br from-purple-400 via-purple-600 to-purple-800 p-6 relative ${(data.jobDesk?.trim() || data.keterangan?.trim()) ? 'rounded-t-xl' : 'rounded-xl'}`}>
        {/* Action Buttons - Top Right Corner */}
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={data.onEdit}
            className="w-7 h-7 bg-white/90 hover:bg-white text-purple-600 rounded-lg flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-110"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={data.onDelete}
            className="w-7 h-7 bg-white/90 hover:bg-white text-red-600 rounded-lg flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-110"
            title="Hapus"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          {data.fotoUrl ? (
            <div className="relative w-28 h-28">
              <Image
                src={data.fotoUrl}
                alt={data.label}
                fill
                className="rounded-full border-4 border-white shadow-2xl object-cover"
              />
            </div>
          ) : (
            <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
              <span className="text-white text-5xl font-bold">{data.label.charAt(0)}</span>
            </div>
          )}
          <div className="text-center flex-1 w-full">
            <h3 className="text-xl font-bold text-white truncate">{data.label}</h3>
            <p className="text-sm text-purple-100 truncate">{data.jabatan}</p>
          </div>
        </div>
      </div>

      {/* Card Body - Job Desk & Keterangan */}
      {((data.jobDesk && data.jobDesk.trim() !== '') || (data.keterangan && data.keterangan.trim() !== '')) && (
        <div className="p-4 bg-white dark:bg-slate-800 rounded-b-xl">
          {/* Job Desk Section */}
          {data.jobDesk && data.jobDesk.trim() !== '' && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-2 uppercase tracking-wide">
                Job Desk
              </h4>
              <div
                className="text-sm text-slate-800 dark:text-slate-200 jobdesk-content leading-relaxed"
                dangerouslySetInnerHTML={{ __html: data.jobDesk }}
              />
            </div>
          )}

          {/* Keterangan */}
          {data.keterangan && data.keterangan.trim() !== '' && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-900 dark:text-white italic text-center font-medium leading-relaxed">
                "{data.keterangan}"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Custom styles for jobDesk HTML content
const jobDeskStyles = `
  .jobdesk-content {
    line-height: 1.5;
  }
  .jobdesk-content ul {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin: 0.25rem 0;
  }
  .jobdesk-content ol {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin: 0.25rem 0;
  }
  .jobdesk-content li {
    margin: 0.1rem 0;
    padding: 0;
  }
  .jobdesk-content p {
    margin: 0.1rem 0;
  }
  .jobdesk-content h1 {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0.4rem 0 0.2rem 0;
  }
  .jobdesk-content h2 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0.3rem 0 0.15rem 0;
  }
  .jobdesk-content h3 {
    font-size: 0.9375rem;
    font-weight: 600;
    margin: 0.25rem 0 0.1rem 0;
  }
  .jobdesk-content blockquote {
    border-left: 3px solid rgb(226, 232, 240);
    padding-left: 0.75rem;
    margin: 0.25rem 0;
    font-style: italic;
    color: rgb(100, 116, 139);
  }
  .jobdesk-content code {
    background-color: rgb(241, 245, 249);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: monospace;
    font-size: 0.875em;
  }
  .jobdesk-content strong {
    font-weight: 600;
    color: rgb(51, 65, 85);
  }
  .jobdesk-content em {
    font-style: italic;
  }
  .jobdesk-content u {
    text-decoration: underline;
  }
  .jobdesk-content hr {
    margin: 0.5rem 0;
    border: none;
    border-top: 1px solid rgb(226, 232, 240);
  }
  .jobdesk-content img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 4px auto;
    display: block;
    object-fit: contain;
  }
  .jobdesk-content p {
    margin-bottom: 0.25rem;
  }
  .jobdesk-content p:last-child {
    margin-bottom: 0;
  }
`;

export default function KolaborasiCrmPage() {
  const nodeTypes: NodeTypes = useMemo(() => ({
    staff: StaffNode,
    note: NoteNode,
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key
  const [arrowTypeDialogOpen, setArrowTypeDialogOpen] = useState(false); // Arrow type dialog state

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Arrow type selection: 'one-way-right' | 'one-way-left' | 'two-way'
  const [arrowType, setArrowType] = useState<'one-way-right' | 'one-way-left' | 'two-way'>('one-way-right');

  // Multi-selection state
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);

  // Fetch data from Convex
  const allStaff = useQuery(api.kolaborasiCrm.getAllStaff);
  const createMutation = useMutation(api.kolaborasiCrm.createStaff);
  const updateMutation = useMutation(api.kolaborasiCrm.updateStaff);
  const deleteMutation = useMutation(api.kolaborasiCrm.deleteStaff);
  const addConnectionMutation = useMutation(api.kolaborasiCrm.addConnection);
  const removeConnectionMutation = useMutation(api.kolaborasiCrm.removeConnection);
  const updatePositionMutation = useMutation(api.kolaborasiCrm.updateStaffPosition);
  const clearAllConnectionsMutation = useMutation(api.kolaborasiCrm.clearAllConnections);
  const migrateJobDeskMutation = useMutation(api.kolaborasiCrm.migrateJobDeskToHtml);

  useEffect(() => {
    if (allStaff) {
      const newNodes: Node[] = allStaff.map((staff) => {
        // Check if this is a note (based on jabatan field)
        const isNote = staff.jabatan === '__NOTE__';

        return {
          id: staff._id,
          type: isNote ? 'note' : 'staff',
          position: { x: staff.positionX, y: staff.positionY },
          data: {
            id: staff._id,
            label: staff.nama,
            jabatan: staff.jabatan,
            fotoUrl: staff.fotoUrl,
            keterangan: staff.keterangan,
            jobDesk: staff.jobDesk,
            content: isNote ? staff.jobDesk || '' : undefined, // For notes
            onEdit: () => handleEdit(staff),
            onDelete: () => handleDelete(staff._id, staff.nama),
          },
          selected: selectedNodeIds.includes(staff._id), // Add selected state
        };
      });

      const newEdges: Edge[] = [];
      allStaff.forEach((staff) => {
        if (staff.connections) {
          staff.connections.forEach((connection) => {
            const connectionId = typeof connection === 'object' ? connection.targetId : connection;
            const connectionData = typeof connection === 'object' ? connection : undefined;

            // Render edge in the direction it was stored (unidirectional)
            const edgeId = `${staff._id}-${connectionId}`;
            const edgeArrowType = connectionData?.arrowType || 'one-way-right';
            const isTwoWay = edgeArrowType === 'two-way';
            const isArrowLeft = edgeArrowType === 'one-way-left';
            const isArrowRight = edgeArrowType === 'one-way-right';

            newEdges.push({
              id: edgeId,
              source: staff._id,
              target: connectionId,
              sourceHandle: connectionData?.fromConnector || 'bottom',
              targetHandle: connectionData?.toConnector || 'top',
              type: 'smoothstep',
              animated: false,
              style: {
                stroke: '#a855f7', // Purple color
                strokeWidth: 3,
              },
              ...(isArrowRight && {
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#a855f7', // Purple color
                },
              }),
              ...(isArrowLeft && {
                markerStart: {
                  type: MarkerType.ArrowClosed,
                  color: '#a855f7', // Purple color
                },
              }),
              ...(isTwoWay && {
                markerStart: {
                  type: MarkerType.ArrowClosed,
                  color: '#a855f7', // Purple color
                },
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#a855f7', // Purple color
                },
              }),
            });
          });
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [allStaff, setNodes, setEdges, dialogOpen, refreshKey, selectedNodeIds]); // Add selectedNodeIds to force re-render

  const onNodeDragStop = useCallback((_: any, node: Node) => {
    // Update the dragged node position
    updatePositionMutation({
      id: node.id as Id<"kolaborasiCrm">,
      positionX: node.position.x,
      positionY: node.position.y,
    })
      .then(() => {
        // Optional: show success toast
      })
      .catch(() => {
        toast.error('❌ Gagal menyimpan posisi!');
      });

    // Also update other selected nodes if any
    if (selectedNodeIds.length > 0) {
      const currentNodes = nodes;
      selectedNodeIds.forEach(nodeId => {
        if (nodeId !== node.id) {
          const selectedNode = currentNodes.find(n => n.id === nodeId);
          if (selectedNode) {
            updatePositionMutation({
              id: nodeId as Id<"kolaborasiCrm">,
              positionX: selectedNode.position.x,
              positionY: selectedNode.position.y,
            }).catch(() => {
              // Silently fail for secondary nodes
            });
          }
        }
      });
    }
  }, [updatePositionMutation, selectedNodeIds, nodes]);

  // Handle selection changes from ReactFlow
  const onSelectionChange = useCallback((params: any) => {
    const selectedNodes = params.nodes || [];
    setSelectedNodeIds(selectedNodes.map((n: Node) => n.id));
  }, []);

  // Handle pane click to clear selection
  const onPaneClick = useCallback(() => {
    setSelectedNodeIds([]);
  }, []);

  const isValidConnection = useCallback((connection: Connection) => {
    // Allow all connections including source-to-source
    // Only prevent self-connections
    return connection.source !== connection.target;
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    const edgeColor = '#a855f7'; // Purple color
    const sourceHandle = connection.sourceHandle || 'bottom';
    const targetHandle = connection.targetHandle || 'top';

    // Determine arrow markers based on arrowType
    const isTwoWay = arrowType === 'two-way';
    const isArrowLeft = arrowType === 'one-way-left';
    const isArrowRight = arrowType === 'one-way-right';

    const newEdge: Edge = {
      id: `${connection.source}-${connection.target}`,
      source: connection.source || '',
      target: connection.target || '',
      sourceHandle: sourceHandle,
      targetHandle: targetHandle,
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: edgeColor,
        strokeWidth: 3,
      },
      // Add markers based on arrow type
      ...(isArrowRight && {
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        },
      }),
      ...(isArrowLeft && {
        markerStart: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        },
      }),
      ...(isTwoWay && {
        markerStart: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
        },
      }),
    };

    // Add edge locally first
    setEdges((eds) => [...eds, newEdge]);

    // Then save to Convex
    addConnectionMutation({
      fromId: connection.source as Id<"kolaborasiCrm">,
      toId: connection.target as Id<"kolaborasiCrm">,
      fromConnector: sourceHandle,
      toConnector: targetHandle,
      type: 'solid',
      label: 'collaboration',
      color: edgeColor,
      routing: 'smoothstep',
      arrowType: arrowType,
    })
      .then((result) => {
        if (result?.alreadyExists) {
          toast.info('ℹ️ Koneksi sudah ada!');
          setEdges((eds) => eds.filter((e) => e.id !== newEdge.id));
        } else {
          toast.success('✅ Koneksi berhasil dibuat!');
        }
      })
      .catch((error) => {
        toast.error('❌ Gagal membuat koneksi: ' + error.message);
        setEdges((eds) => eds.filter((e) => e.id !== newEdge.id));
      });
  }, [addConnectionMutation, setEdges, arrowType]);

  const handleAdd = () => {
    setDialogMode('add');
    setSelectedStaff(null);
    setIsAddingNote(false);
    setDialogOpen(true);
  };

  const handleAddNote = () => {
    setDialogMode('add');
    setSelectedStaff(null);
    setIsAddingNote(true);
    setDialogOpen(true);
  };

  const handleEdit = (staff: any) => {
    setDialogMode('edit');
    setSelectedStaff(staff);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setIsAddingNote(false);

    // Force refresh by incrementing refreshKey
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 100);
  };

  const showHelp = () => {
    toast.success('📌 Panduan Penggunaan', {
      description: (
        <div className="text-slate-900 dark:text-white">
          <p className="font-semibold mb-1">✨ DRAG CARD:</p>
          <p className="text-sm ml-4 mb-2">Geser card untuk atur posisi</p>
          <p className="font-semibold mb-1">✨ MULTI-SELECT:</p>
          <p className="text-sm ml-4 mb-2">Ctrl/Cmd + Klik untuk select multiple card</p>
          <p className="font-semibold mb-1">✨ CONNECT:</p>
          <p className="text-sm ml-4 mb-2">Drag dari titik ungu di KANAN/BAWAH card ke KIRI/ATAS card lain</p>
          <p className="font-semibold mb-1">❌ DELETE EDGE:</p>
          <p className="text-sm ml-4">Klik pada garis koneksi untuk menghapus</p>
        </div>
      ),
      duration: 10000,
    });
  };

  const handleClearAllConnections = async () => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Semua Koneksi',
      description: '⚠️ Apakah Anda yakin ingin menghapus SEMUA koneksi antar staff? Tindakan ini tidak dapat dibatalkan.',
      onConfirm: async () => {
        try {
          await clearAllConnectionsMutation();
          toast.success('✅ Semua koneksi berhasil dihapus!');
          setEdges([]);
        } catch (error) {
          toast.error('❌ Gagal menghapus koneksi!');
        }
      },
    });
  };

  const handleMigrateJobDesk = async () => {
    setConfirmDialog({
      open: true,
      title: 'Migrasi Job Desk',
      description: '⚠️ Migrasi jobDesk dari array ke HTML format? Ini akan mengubah format data lama.',
      onConfirm: async () => {
        try {
          const result = await migrateJobDeskMutation();
          toast.success(`✅ Migrasi berhasil! ${result.migrated} staff di-migrate`);
          // Refresh page to see changes
          setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
          toast.error('❌ Gagal migrasi jobDesk!');
        }
      },
    });
  };

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const sourceId = edge.source as Id<"kolaborasiCrm">;
    const targetId = edge.target as Id<"kolaborasiCrm">;

    setConfirmDialog({
      open: true,
      title: 'Hapus Koneksi',
      description: 'Apakah Anda yakin ingin menghapus koneksi ini?',
      onConfirm: async () => {
        removeConnectionMutation({
          fromId: sourceId,
          toId: targetId,
        })
          .then(() => {
            toast.success('✅ Koneksi berhasil dihapus!');
          })
          .catch(() => {
            toast.error('❌ Gagal menghapus koneksi!');
          });
      },
    });
  }, [removeConnectionMutation]);

  const handleDelete = async (id: Id<"kolaborasiCrm">, nama: string) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Staff',
      description: `Apakah Anda yakin ingin menghapus ${nama}?`,
      onConfirm: async () => {
        try {
          await deleteMutation({ id });
          toast.success(`✅ ${nama} berhasil dihapus!`);
        } catch (error) {
          toast.error('❌ Gagal menghapus staff!');
        }
      },
    });
  };

  return (
    <>
      <style>{jobDeskStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-md">
        <div className="max-w-full mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
                Kolaborasi CRM
              </h1>
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={showHelp}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                  title="Cara menggunakan"
                >
                  ❓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllConnections}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  title="Hapus semua koneksi"
                >
                  🗑️
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMigrateJobDesk}
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                  title="Migrasi jobDesk ke format HTML"
                >
                  🔄
                </Button>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              ✨ Klik card untuk select • Ctrl/Cmd + Klik untuk multi-select • Drag card untuk geser semua • Drag dari titik ke titik untuk connect • Klik garis untuk hapus
            </p>
          </div>
          <div className="hidden sm:flex gap-3 items-center">
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-purple-400 to-purple-700 hover:from-purple-500 hover:to-purple-800 text-white shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Staff
            </Button>
            <Button
              onClick={handleAddNote}
              className="bg-gradient-to-r from-fuchsia-400 to-purple-600 hover:from-fuchsia-500 hover:to-purple-700 text-white shadow-lg cursor-pointer"
            >
              <StickyNote className="w-4 h-4 mr-2" />
              Tambah Note
            </Button>

            {/* Arrow Type Selector */}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-300 dark:border-slate-600">
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Tipe Panah:</span>
              <div className="flex gap-1">
                <Button
                  variant={arrowType === 'one-way-right' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setArrowType('one-way-right')}
                  className={arrowType === 'one-way-right'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                    : 'cursor-pointer'
                  }
                  title="Panah ke Kanan (→)"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant={arrowType === 'one-way-left' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setArrowType('one-way-left')}
                  className={arrowType === 'one-way-left'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                    : 'cursor-pointer'
                  }
                  title="Panah ke Kiri (←)"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant={arrowType === 'two-way' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setArrowType('two-way')}
                  className={arrowType === 'two-way'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                    : 'cursor-pointer'
                  }
                  title="Panah 2 Arah (↔)"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="max-w-full mx-2 sm:mx-5 mb-20 sm:mb-5 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700" style={{ height: 'calc(100vh - 180px)', cursor: 'crosshair' }}>
        <style>{`
          /* Black pointer for canvas area */
          .react-flow__pane {
            cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5'%3E%3Cpath d='M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z' fill='black'/%3E%3C/svg%3E") 0 24, pointer !important;
          }

          /* Black crosshair for connector handles */
          .react-flow__handle,
          .react-flow__handle:hover {
            cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' stroke='black' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10' fill='none'/%3E%3Cline x1='12' y1='2' x2='12' y2='22'/%3E%3Cline x1='2' y1='12' x2='22' y2='12'/%3E%3C/svg%3E") 12 12, crosshair !important;
          }

          /* Black open hand cursor for nodes (but not handles) */
          .react-flow__node {
            cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 11V6a2 2 0 0 0-4 0v5'/%3E%3Cpath d='M14 11V4a2 2 0 0 0-4 0v7'/%3E%3Cpath d='M10 11V9a2 2 0 0 0-4 0v2'/%3E%3Cpath d='M6 11V4a2 2 0 0 1 4 0v7'/%3E%3Cpath d='M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15'/%3E%3C/svg%3E") 12 12, grab !important;
          }

          /* Black closed fist cursor when dragging nodes */
          .react-flow__node:active {
            cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='black' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M18 11V6a2 2 0 0 0-4 0v5'/%3E%3Cpath d='M14 11V4a2 2 0 0 0-4 0v7'/%3E%3Cpath d='M10 11V9a2 2 0 0 0-4 0v2'/%3E%3Cpath d='M6 11V4a2 2 0 0 1 4 0v7'/%3E%3Cpath d='M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15'/%3E%3C/svg%3E") 12 12, grabbing !important;
          }

          /* Smaller controls on mobile */
          @media (max-width: 1024px) {
            .react-flow__controls {
              transform: scale(0.75);
              transform-origin: bottom right;
            }
          }

          @media (max-width: 640px) {
            .react-flow__controls {
              transform: scale(0.65);
            }
          }
        `}</style>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onSelectionChange={onSelectionChange}
          onPaneClick={onPaneClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          isValidConnection={isValidConnection}
          fitView
          attributionPosition="bottom-left"
          multiSelectionKeyCode="Control" // Enable Ctrl/Cmd for multi-selection
          deleteKeyCode="Delete" // Enable Delete key for deleting selected nodes
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
          <div className="hidden lg:block">
            <MiniMap
              nodeColor={() => '#a855f7'}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </div>
        </ReactFlow>
      </div>

      {/* Dialog Add/Edit Staff */}
      <KolaborasiCrmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={selectedStaff}
        mode={dialogMode}
        isNote={isAddingNote}
        onSuccess={handleDialogSuccess}
      />

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <DialogTitle>{confirmDialog.title}</DialogTitle>
                <DialogDescription>{confirmDialog.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border lg:hidden">
        <div className="grid grid-cols-4 gap-1 p-2">
          {/* Info Button */}
          <button
            onClick={showHelp}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          >
            <Info className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Info</span>
          </button>

          {/* Add Staff Button */}
          <button
            onClick={handleAdd}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors bg-gradient-to-r from-purple-400 to-purple-700 hover:from-purple-500 hover:to-purple-800 text-white shadow-md"
          >
            <Plus className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Staff</span>
          </button>

          {/* Add Note Button */}
          <button
            onClick={handleAddNote}
            className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors bg-gradient-to-r from-fuchsia-400 to-purple-600 hover:from-fuchsia-500 hover:to-purple-700 text-white shadow-md"
          >
            <StickyNote className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">Note</span>
          </button>

          {/* Arrow Type Button */}
          <button
            onClick={() => setArrowTypeDialogOpen(true)}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-colors ${
              arrowType === 'two-way'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400'
            }`}
          >
            {arrowType === 'one-way-right' && <ArrowRight className="h-5 w-5 mb-1" />}
            {arrowType === 'one-way-left' && <ArrowLeft className="h-5 w-5 mb-1" />}
            {arrowType === 'two-way' && <ArrowRightLeft className="h-5 w-5 mb-1" />}
            <span className="text-[10px] font-medium">Panah</span>
          </button>
        </div>
      </div>

      {/* Arrow Type Dialog for Mobile */}
      <Dialog open={arrowTypeDialogOpen} onOpenChange={setArrowTypeDialogOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Pilih Tipe Panah</DialogTitle>
            <DialogDescription>
              Pilih arah panah untuk koneksi yang akan dibuat
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            <button
              onClick={() => {
                setArrowType('one-way-right');
                setArrowTypeDialogOpen(false);
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                arrowType === 'one-way-right'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-purple-400'
              }`}
            >
              <ArrowRight className="w-8 h-8 text-purple-600" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Kanan (→)</span>
            </button>
            <button
              onClick={() => {
                setArrowType('one-way-left');
                setArrowTypeDialogOpen(false);
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                arrowType === 'one-way-left'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-purple-400'
              }`}
            >
              <ArrowLeft className="w-8 h-8 text-purple-600" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Kiri (←)</span>
            </button>
            <button
              onClick={() => {
                setArrowType('two-way');
                setArrowTypeDialogOpen(false);
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                arrowType === 'two-way'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-purple-400'
              }`}
            >
              <ArrowRightLeft className="w-8 h-8 text-purple-600" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">2 Arah (↔)</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
