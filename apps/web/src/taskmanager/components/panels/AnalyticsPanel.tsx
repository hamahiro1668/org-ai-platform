import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { AnalyticsResult } from '../../types';

const COLORS = ['#E8863A', '#8B5CF6', '#0EA5E9', '#10B981', '#D97706', '#EC4899', '#6366F1', '#F59E0B'];

interface AnalyticsPanelProps {
  result: AnalyticsResult;
}

export function AnalyticsPanel({ result }: AnalyticsPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${result.title}\n\n${result.summary}\n\nデータ:\n${JSON.stringify(result.data, null, 2)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderChart = () => {
    switch (result.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={result.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eae8e3" />
              <XAxis dataKey={result.xKey} tick={{ fontSize: 11, fill: '#8A8A8A' }} />
              <YAxis tick={{ fontSize: 11, fill: '#8A8A8A' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #eae8e3', fontSize: '12px' }}
              />
              <Bar dataKey={result.yKey} radius={[6, 6, 0, 0]}>
                {result.data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={result.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eae8e3" />
              <XAxis dataKey={result.xKey} tick={{ fontSize: 11, fill: '#8A8A8A' }} />
              <YAxis tick={{ fontSize: 11, fill: '#8A8A8A' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #eae8e3', fontSize: '12px' }}
              />
              <Line type="monotone" dataKey={result.yKey} stroke="#E8863A" strokeWidth={2} dot={{ r: 4, fill: '#E8863A' }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={result.data}
                dataKey={result.yKey}
                nameKey={result.xKey}
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#BCBCBC' }}
              >
                {result.data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #eae8e3', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-[#2D2D2D]">{result.title}</h3>
          <p className="text-xs text-[#8A8A8A] mt-1">{result.summary}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-[#8A8A8A] hover:text-[#E8863A] transition-colors px-2 py-1 rounded-lg hover:bg-[#f5f5f0]"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'コピー済' : 'コピー'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#eae8e3] p-4">
        {renderChart()}
      </div>

      {result.risks.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-700 mb-1">リスク・注意点</p>
          <ul className="text-xs text-amber-600 space-y-0.5">
            {result.risks.map((r, i) => (
              <li key={i}>- {r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
