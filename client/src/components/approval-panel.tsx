/**
 * 審批面板組件
 * 顯示待審批任務，支援通過/駁回操作
 */
import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Textarea } from "./textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { CheckCircle, XCircle, Clock, FileText, ChevronDown, ChevronUp } from "lucide-react";

interface ApprovalPanelProps {
  className?: string;
  onApprovalComplete?: () => void;
}

export function ApprovalPanel({ className, onApprovalComplete }: ApprovalPanelProps) {
  const { data, refetch, isLoading } = trpc.chiefOfStaff.pendingApprovals.useQuery();
  const approveMutation = trpc.chiefOfStaff.approveTask.useMutation();
  const rejectMutation = trpc.chiefOfStaff.rejectTask.useMutation();
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

  const handleApprove = async (approvalId: string) => {
    try {
      await approveMutation.mutateAsync({ approvalId, comment: comment || undefined });
      setComment("");
      refetch();
      onApprovalComplete?.();
    } catch (error) {
      console.error("Approval failed:", error);
    }
  };

  const handleReject = async () => {
    if (!selectedApprovalId) return;
    
    try {
      await rejectMutation.mutateAsync({ approvalId: selectedApprovalId, comment: comment || undefined });
      setComment("");
      setRejectDialogOpen(false);
      setSelectedApprovalId(null);
      refetch();
      onApprovalComplete?.();
    } catch (error) {
      console.error("Rejection failed:", error);
    }
  };

  const openRejectDialog = (approvalId: string) => {
    setSelectedApprovalId(approvalId);
    setRejectDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className={`p-4 ${className || ""}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.count === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className || ""}`}>
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>目前沒有待審批的任務</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">待審批任務</h3>
        <Badge variant="destructive">{data.count}</Badge>
      </div>
      
      {data.approvals.map((approval) => (
        <Card key={approval.id} className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{approval.stageName}</CardTitle>
                <CardDescription className="text-sm">
                  任務 ID: {approval.taskId.slice(0, 12)}...
                </CardDescription>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(approval.requestedAt).toLocaleString("zh-TW", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* AI 摘要 */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {approval.aiSummary}
              </p>
            </div>
            
            {/* 交付物 */}
            {approval.deliverables && approval.deliverables.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setExpandedId(expandedId === approval.id ? null : approval.id)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <FileText className="w-4 h-4" />
                  <span>交付物 ({approval.deliverables.length})</span>
                  {expandedId === approval.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                
                {expandedId === approval.id && (
                  <div className="pl-5 space-y-2">
                    {approval.deliverables.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 bg-white border rounded text-sm"
                      >
                        <Badge variant="secondary" className="text-xs">
                          {item.type.toUpperCase()}
                        </Badge>
                        <span className="flex-1">{item.title}</span>
                        {item.url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                              查看
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex gap-2 pt-2">
            <Button
              variant="default"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => handleApprove(approval.id)}
              disabled={approveMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              通過
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => openRejectDialog(approval.id)}
              disabled={rejectMutation.isPending}
            >
              <XCircle className="w-4 h-4 mr-1" />
              駁回
            </Button>
          </CardFooter>
        </Card>
      ))}
      
      {/* 駁回對話框 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>駁回審批</DialogTitle>
            <DialogDescription>
              請說明駁回原因，AI 將根據您的反饋重新處理。
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            placeholder="請輸入駁回原因（選填）..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              確認駁回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * 審批按鈕 - 顯示待審批數量徽章
 */
export function ApprovalButton({ onClick }: { onClick?: () => void }) {
  const { data } = trpc.chiefOfStaff.pendingApprovals.useQuery();
  
  if (!data || data.count === 0) {
    return null;
  }
  
  return (
    <Button
      variant="outline"
      className="relative"
      onClick={onClick}
    >
      <Clock className="w-4 h-4 mr-2" />
      待審批
      <Badge
        variant="destructive"
        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
      >
        {data.count}
      </Badge>
    </Button>
  );
}

/**
 * 審批歷史記錄
 */
export function ApprovalHistory({ taskId }: { taskId: string }) {
  const { data: task } = trpc.chiefOfStaff.task.useQuery({ taskId });
  
  if (!task?.approvalHistory || task.approvalHistory.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">審批歷史</h4>
      
      <div className="space-y-2">
        {task.approvalHistory.map((record, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border ${
              record.status === "approved"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{record.stageName}</span>
              <Badge variant={record.status === "approved" ? "default" : "destructive"}>
                {record.status === "approved" ? "✅ 已通過" : "❌ 已駁回"}
              </Badge>
            </div>
            
            {record.comment && (
              <p className="text-sm text-gray-600 mt-1">
                {record.comment}
              </p>
            )}
            
            <p className="text-xs text-gray-400 mt-1">
              {record.approverName} · {new Date(record.respondedAt || record.requestedAt).toLocaleString("zh-TW")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
