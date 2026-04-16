frappe.pages['mentor-dashboard'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Mentor Dashboard',
        single_column: true
    });

    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Mentor',
            filters: { user: frappe.session.user },
            fields: ['name','mentor_name','email'],
            limit: 1
        },
        callback: function(r) {
            if (!r.message || !r.message.length) {
                page.main.html(`
                    <div style="text-align:center;padding:80px 20px">
                        <div style="font-size:16px;color:var(--text-muted)">
                            No mentor profile linked to your account.
                        </div>
                    </div>`);
                return;
            }
            load_mentor_data(page, r.message[0]);
        }
    });
};

function load_mentor_data(page, mentor) {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Intern',
            filters: { mentor: mentor.name },
            fields: ['name','intern_name','attendance_percentage',
                     'present_days','total_working_days','low_attendance','status'],
            limit: 50
        },
        callback: function(interns_r) {
            var interns = interns_r.message || [];
            if (!interns.length) {
                page.main.html(`
                    <div style="text-align:center;padding:80px 20px">
                        <div style="font-size:16px;color:var(--text-muted)">
                            No interns assigned to you yet.
                        </div>
                    </div>`);
                return;
            }

            var intern_names = interns.map(i => i.name);
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Daily Work Logs',
                    filters: { intern: ['in', intern_names] },
                    fields: ['name','intern','date','hours_worked',
                             'status','is_late','work_description'],
                    limit: 500,
                    order_by: 'date desc'
                },
                callback: function(logs_r) {
                    render_mentor_page(page, mentor, interns, logs_r.message || []);
                }
            });
        }
    });
}

function render_mentor_page(page, mentor, interns, logs) {
    var pending = logs.filter(l => l.status === 'Submitted').length;
    var late = logs.filter(l => l.is_late).length;
    var low_att = interns.filter(i => i.low_attendance).length;
    var total_hours = Math.round(logs.reduce((s,l) => s+(l.hours_worked||0),0)*10)/10;
    var initials = (mentor.mentor_name||mentor.name).charAt(0).toUpperCase();

    page.main.html(`
    <div style="padding:24px;max-width:1000px;margin:0 auto;font-family:var(--font-stack)">

      <!-- Header -->
      <div style="background:var(--card-bg);border:1px solid var(--border-color);
          border-radius:12px;padding:24px;margin-bottom:20px;
          display:flex;align-items:center;gap:20px">
        <div style="width:64px;height:64px;border-radius:50%;
            background:linear-gradient(135deg,#e67e22,#e74c3c);
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-size:26px;font-weight:700;flex-shrink:0">
          ${initials}
        </div>
        <div>
          <div style="font-size:22px;font-weight:600;color:var(--text-color);margin-bottom:4px">
            ${mentor.mentor_name || mentor.name}
          </div>
          <div style="font-size:13px;color:var(--text-muted)">
            ${interns.length} intern${interns.length>1?'s':''} assigned
            &nbsp;·&nbsp; ${mentor.email || ''}
          </div>
        </div>
      </div>

      <!-- Metric Cards -->
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:20px">
        ${mcard('Total Interns', interns.length, '#3498db')}
        ${mcard('Pending Reviews', pending, '#f39c12')}
        ${mcard('Late Submissions', late, '#e74c3c')}
        ${mcard('Low Attendance', low_att, '#e74c3c')}
      </div>

      <!-- Interns Overview -->
      <div style="background:var(--card-bg);border:1px solid var(--border-color);
          border-radius:12px;padding:20px;margin-bottom:20px">
        <div style="font-size:14px;font-weight:600;color:var(--text-color);margin-bottom:16px">
          Interns Overview
        </div>
        ${interns.map(intern => {
            var att = Math.round(intern.attendance_percentage || 0);
            var att_color = att >= 75 ? '#27ae60' : '#e74c3c';
            var intern_logs = logs.filter(l => l.intern === intern.name);
            var intern_pending = intern_logs.filter(l => l.status === 'Submitted').length;
            return `
            <div style="display:flex;align-items:center;gap:16px;padding:14px 0;
                border-bottom:1px solid var(--border-color);cursor:pointer"
                onclick="frappe.set_route('Form','Intern','${intern.name}')">
              <div style="width:36px;height:36px;border-radius:50%;
                  background:linear-gradient(135deg,#3498db,#9b59b6);
                  display:flex;align-items:center;justify-content:center;
                  color:#fff;font-size:14px;font-weight:700;flex-shrink:0">
                ${(intern.intern_name||intern.name).charAt(0).toUpperCase()}
              </div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:600;color:var(--text-color)">
                  ${intern.intern_name || intern.name}
                </div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
                  ${intern_logs.length} logs · ${intern_pending} pending review
                  ${intern.low_attendance ? ' · <span style="color:#e74c3c">⚠ Low attendance</span>' : ''}
                </div>
              </div>
              <div style="text-align:right">
                <div style="font-size:18px;font-weight:700;color:${att_color}">${att}%</div>
                <div style="font-size:10px;color:var(--text-muted)">attendance</div>
              </div>
              <div style="width:80px">
                <div style="background:#eee;border-radius:20px;height:6px;overflow:hidden">
                  <div style="width:${att}%;height:100%;border-radius:20px;background:${att_color}"></div>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>

      <!-- Pending Reviews -->
      <div style="background:var(--card-bg);border:1px solid var(--border-color);
          border-radius:12px;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div style="font-size:14px;font-weight:600;color:var(--text-color)">
            Pending Reviews
            ${pending > 0 ? `<span style="background:#fef9e7;color:#9a7d0a;font-size:11px;
              padding:2px 8px;border-radius:20px;margin-left:8px">${pending}</span>` : ''}
          </div>
          <button onclick="frappe.set_route('List','Daily Work Logs',{status:'Submitted'})"
            style="font-size:12px;color:#3498db;background:none;border:none;cursor:pointer">
            View all →
          </button>
        </div>
        ${logs.filter(l => l.status==='Submitted').slice(0,8).map(l => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 0;
            border-bottom:1px solid var(--border-color);cursor:pointer"
            onclick="frappe.set_route('Form','Daily Work Logs','${l.name}')">
          <div style="flex:1">
            <div style="font-size:13px;font-weight:500;color:var(--text-color)">
              ${l.intern}
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">
              ${l.date} · ${l.hours_worked||0}h
              ${l.is_late ? ' · <span style="color:#e74c3c">⚑ Late</span>' : ''}
            </div>
          </div>
          <span style="padding:3px 12px;border-radius:20px;font-size:11px;font-weight:500;
              background:#fef9e7;color:#9a7d0a">Pending</span>
        </div>`).join('') || `
        <div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px">
          No pending reviews 🎉
        </div>`}
      </div>

    </div>
    `);
}

function mcard(label, value, color) {
    return `
    <div style="background:var(--card-bg);border:1px solid var(--border-color);
        border-radius:10px;padding:16px">
      <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;
          letter-spacing:.05em;margin-bottom:8px">${label}</div>
      <div style="font-size:28px;font-weight:700;color:${color}">${value}</div>
    </div>`;
}
