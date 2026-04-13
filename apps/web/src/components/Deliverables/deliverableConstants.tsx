import {
  Mail,
  Share2,
  FileText,
  Calendar,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';

export const TYPE_ICON: Record<string, LucideIcon> = {
  email: Mail,
  sns: Share2,
  proposal: FileText,
  content_calendar: FileText,
  document: FileText,
  meeting_notes: FileText,
  schedule: Calendar,
  receipt_summary: FileText,
  expense_report: FileText,
  invoice_check: FileText,
  market_analysis: BarChart3,
  data_visualization: BarChart3,
};

export const TYPE_LABEL: Record<string, string> = {
  email: 'メール',
  sns: 'SNS投稿',
  proposal: '提案書',
  content_calendar: 'コンテンツ',
  document: '資料',
  meeting_notes: '議事録',
  schedule: 'スケジュール',
  receipt_summary: '経費まとめ',
  expense_report: '経費レポート',
  invoice_check: '請求確認',
  market_analysis: '市場分析',
  data_visualization: 'データ可視化',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DeliverablePreview({ data }: { data: any }) {
  const taskType = data?.taskType;
  switch (taskType) {
    case 'email':
      return (
        <div className="text-xs text-secondary space-y-0.5">
          <p>
            <span className="text-muted">To:</span> {data.to}
          </p>
          <p>
            <span className="text-muted">件名:</span> {data.subject}
          </p>
          <p className="line-clamp-2">{data.body?.slice(0, 100)}</p>
        </div>
      );
    case 'sns':
      return (
        <div className="text-xs text-secondary">
          <p className="line-clamp-3">{data.content?.slice(0, 150)}</p>
          {data.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {data.hashtags.slice(0, 5).map((tag: string) => (
                <span key={tag} className="text-micro text-accent">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    case 'schedule':
      return (
        <div className="text-xs text-secondary">
          <p className="font-medium text-primary">{data.title}</p>
          {data.preferredDates?.slice(0, 2).map((d: string, i: number) => (
            <p key={i}>{d}</p>
          ))}
        </div>
      );
    case 'market_analysis':
    case 'data_visualization':
      return (
        <div className="text-xs text-secondary">
          {data.summary && <p className="line-clamp-2">{data.summary}</p>}
          {data.conclusion && (
            <p className="text-dept-analytics line-clamp-1 mt-0.5">
              {data.conclusion}
            </p>
          )}
        </div>
      );
    default:
      return (
        <div className="text-xs text-secondary">
          {data.title && <p className="font-medium text-primary">{data.title}</p>}
          {data.summary && <p className="line-clamp-2">{data.summary}</p>}
          {data.content && typeof data.content === 'string' && (
            <p className="line-clamp-2">{data.content.slice(0, 120)}</p>
          )}
        </div>
      );
  }
}
