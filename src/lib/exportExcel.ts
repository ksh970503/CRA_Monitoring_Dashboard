import * as XLSX from 'xlsx';
import { WorkLog } from '../types';
import { format } from 'date-fns';

export function exportWorkLogsToExcel(logs: WorkLog[], monthStr: string) {
  const exportData = logs.map((log, index) => ({
    'No.': index + 1,
    '일자': log.date,
    '과제명': log.studies?.name || '공통',
    '업무 유형': log.work_type,
    '업무 내용': log.content,
    '소요시간(h)': log.hours,
    'Follow-up 필요': log.needs_followup ? '예' : '아니오',
    'Next Action': log.next_action || '',
    'Follow-up Due': log.due_date || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },   // No
    { wch: 12 },  // Date
    { wch: 24 },  // Study
    { wch: 16 },  // Type
    { wch: 40 },  // Content
    { wch: 12 },  // Hours
    { wch: 14 },  // Followup
    { wch: 30 },  // Next action
    { wch: 14 },  // Due
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '업무일지');

  const filename = `CRA_WorkLog_${monthStr}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
