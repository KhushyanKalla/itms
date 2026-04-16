frappe.pages['itms-performance'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'My Performance',
        single_column: true
    });

    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Intern',
            filters: { user: frappe.session.user },
            fields: ['name','intern_name','mentor','joining_date',
                     'completion_date','attendance_percentage',
                     'present_days','total_working_days','low_attendance'],
            limit: 1
        },
        callback: function(r) {
            if (!r.message || !r.message.length) {
                page.main.html(`
                    <div style="text-align:center;padding:80px 20px">
                        <div style="font-size:48px;margin-bottom:16px">👤</div>
                        <div style="font-size:16px;color:var(--text-muted)">
                            No intern profile linked to your account.
                        </div>
                    </div>`);
                return;
            }
            var intern = r.message[0];
            load_intern_data(page, intern);
        }
    });
};

function load_intern_data(page, intern) {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Daily Work Logs',
            filters: { intern: intern.name },
            fields: ['name','date','hours_worked','status','is_late','work_description'],
            limit: 500,
            order_by: 'date desc'
        },
        callback: function(logs_r) {
            var logs = logs_r.message || [];
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Intern Attendance',
                    filters: { intern: intern.name },
                    fields: ['date','status'],
                    limit: 500
                },
                callback: function(att_r) {
                    render_intern_page(page, intern, logs, att_r.message || []);
                }
            });
        }
    });
}

function render_intern_page(page, intern, logs, attendance) {
    var total_logs = logs.length;
    var total_hours = Math.round(logs.reduce((s,l) => s+(l.hours_worked||0), 0) * 10) / 10;
    var approved = logs.filter(l => l.status==='Approved').length;
    var pending = logs.filter(l => l.status==='Submitted').length;
    var rejected = logs.filter(l => l.status==='Rejected').length;
    var late = logs.filter(l => l.is_late).length;
    var att = Math.round(intern.attendance_percentage || 0);
    var att_color = att >= 75 ? '#27ae60' : '#e74c3c';
    var initials = (intern.intern_name||intern.name).charAt(0).toUpperCase();

    page.main.html(`
    <div style="padding:24px;max-width:1000px;margin:0 auto;font-family:var(--font-stack)">

      ${intern.low_attendance ? `
      <div style="background:#fdf2f2;border-left:4px solid #e74c3c;padding:12px 16px;
          border-radius:0 8px 8px 0;margin-bottom:20px;display:flex;
          align-items:center;gap:10px">
        <span style="color:#e74c3c;font-size:18px">⚠</span>
        <span style="color:#c0392b;font-size:13px;font-weight:500">
          Low Attendance: ${att}% — Below 75% threshold. Please improve attendance.
        </span>
      </div>` : ''}

      <div style="background:var(--card-bg);border:1px solid var(--border-color);
          border-radius:12px;padding:24px;margin-bottom:20px;
          display:flex;align-items:center;gap:20px">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#3498db,#9b59b6);
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-size:26px;font-weight:700;flex-shrink:0">
          ${initials}
        </div>
        <div style="flex:1">
          <div style="font-size:22px;font-weight:600;color:var(--text-color);margin-bottom:4px">
            ${intern.intern_name || intern.name}
          </div>
          <div style="font-size:13px;color:var(--text-muted)">
            Mentor: <strong>${intern.mentor || 'Not assigned'}</strong>
            &nbsp;·&nbsp;
            Joined: <strong>${intern.joining_date || '—'}</strong>
            ${intern.completion_date ? `&nbsp;·&nbsp; Completing: <strong>${intern.completion_date}</strong>` : ''}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:32px;font-weight:700;color:${att_color}">${att}%</div>
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em">Attendance</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:12px">
        ${icard('Total Logs', total_logs, '#3498db', '📋')}
        ${icard('Hours Logged', total_hours+'h', '#9b59b6', '⏱')}
        ${icard('Approved', approved, '#27ae60', '✓')}
        ${icard('Pending', pending, '#f39c12', '⏳')}
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:20px">
        ${icard('Rejected', rejected, '#e74c3c', '✗')}
        ${icard('Late Submissions', late, '#e67e22', '⚑')}
        ${icard('Present Days', intern.present_days||0, '#1abc9c', '📅')}
      </div>

      <div style="background:var(--card-bg);border:1px solid var(--border-color);
          border-radius:12px;padding:20px;margin-bottom:20px">
        <div style="font-size:14px;font-weight:600;color:var(--text-color);margin-bottom:4px">
          Attendance Heatmap
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:14px">
          Last 6 months — each square is one day
        </div>
        <div id="itms-heatmap" style="overflow-x:auto;padding-bottom:4px"></div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:11px;color:var(--text-muted)">
          <div style="width:11px;height:11px;border-radius:2px;background:#eee;border:1px solid #ddd"></div><span>No data</span>
          <div style="width:11px;height:11px;border-radius:2px;background:#2ecc71;margin-left:8px"></div><span>Present</span>
          <div style="width:11px;height:11px;border-radius:2px;background:#e74c3c;margin-left:8px"></div><span>Absent</span>
        </div>
      </div>

      <div style="background:var(--card-bg);border:1px solid var(--border-color);
          border-radius:12px;padding:20px">
        <div style="font-size:14px;font-weight:600;color:var(--text-color);margin-bottom:16px">
          Recent Work Logs
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="border-bottom:2px solid var(--border-color)">
              <th style="text-align:left;padding:8px 0;color:var(--text-muted);font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Date</th>
              <th style="text-align:left;padding:8px 0;color:var(--text-muted);font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Description</th>
              <th style="text-align:left;padding:8px 0;color:var(--text-muted);font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Hours</th>
              <th style="text-align:left;padding:8px 0;color:var(--text-muted);font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Status</th>
              <th style="text-align:left;padding:8px 0;color:var(--text-muted);font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:.05em">Flag</th>
            </tr>
          </thead>
          <tbody>
            ${logs.slice(0,10).map(l => `
            <tr style="border-bottom:1px solid var(--border-color);cursor:pointer" onclick="frappe.set_route('Form','Daily Work Logs','${l.name}')">
              <td style="padding:10px 0;color:var(--text-color)">${l.date}</td>
              <td style="padding:10px 0;color:var(--text-muted);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${(l.work_description||'').substring(0,60)}${l.work_description && l.work_description.length>60?'...':''}
              </td>
              <td style="padding:10px 0;color:var(--text-color)">${l.hours_worked||0}h</td>
              <td style="padding:10px 0">
                <span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:500;
                  background:${sbg(l.status)};color:${stxt(l.status)}">
                  ${l.status||'—'}
                </span>
              </td>
              <td style="padding:10px 0;font-size:12px;color:${l.is_late?'#e74c3c':'var(--text-muted)'}">
                ${l.is_late?'⚑ Late':'—'}
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
        <div style="margin-top:12px;text-align:right">
          <button onclick="frappe.set_route('List','Daily Work Logs')"
            style="font-size:12px;color:#3498db;background:none;border:none;cursor:pointer;padding:4px 0">
            View all logs →
          </button>
        </div>
      </div>

    </div>
    `);

    setTimeout(() => render_heatmap(attendance), 100);
}

function render_heatmap(attendance) {
    var container = document.getElementById('itms-heatmap');
    if (!container) return;

    var att_map = {};
    attendance.forEach(a => { att_map[a.date] = a.status; });

    var end = new Date();
    var start = new Date();
    start.setMonth(start.getMonth() - 5);
    start.setDate(1);

    var d = new Date(start);
    while (d.getDay() !== 0) d.setDate(d.getDate() - 1);

    var html = '<div style="display:flex;gap:3px">';
    while (d <= end) {
        html += '<div style="display:flex;flex-direction:column;gap:3px">';
        for (var i = 0; i < 7; i++) {
            var ds = d.toISOString().split('T')[0];
            var status = att_map[ds];
            var bg = '#eee';
            var title = ds;
            if (d < start || d > end) {
                bg = 'transparent';
            } else if (status === 'Present') {
                bg = '#2ecc71'; title += ' — Present';
            } else if (status === 'Absent') {
                bg = '#e74c3c'; title += ' — Absent';
            } else {
                title += ' — Not marked';
            }
            html += `<div title="${title}"
                style="width:13px;height:13px;border-radius:2px;background:${bg};
                cursor:pointer;transition:opacity .15s"
                onmouseover="this.style.opacity='.7'"
                onmouseout="this.style.opacity='1'"></div>`;
            d.setDate(d.getDate() + 1);
        }
        html += '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
}

function icard(label, value, color, icon) {
    return `
    <div style="background:var(--card-bg);border:1px solid var(--border-color);
        border-radius:10px;padding:16px;position:relative;overflow:hidden">
      <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;
          letter-spacing:.05em;margin-bottom:8px">${label}</div>
      <div style="font-size:28px;font-weight:700;color:${color}">${value}</div>
      <div style="position:absolute;right:14px;top:12px;font-size:20px;opacity:.15">
        ${icon}
      </div>
    </div>`;
}

function sbg(s) {
    return {Approved:'#d5f5e3',Rejected:'#fadbd8',Submitted:'#fef9e7',
            Reviewed:'#d6eaf8',Pending:'#f2f3f4'}[s]||'#f2f3f4';
}
function stxt(s) {
    return {Approved:'#1e8449',Rejected:'#922b21',Submitted:'#9a7d0a',
            Reviewed:'#1a5276',Pending:'#7f8c8d'}[s]||'#7f8c8d';
}
