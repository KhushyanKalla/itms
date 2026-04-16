frappe.pages['itms-admin-overview'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'ITMS Admin Overview',
        single_column: true
    });

    // Load all data in parallel
    Promise.all([
        frappe.call({ method: 'frappe.client.get_list', args: {
            doctype: 'Intern', fields: ['name','intern_name','mentor',
            'attendance_percentage','low_attendance','status'], limit: 100
        }}),
        frappe.call({ method: 'frappe.client.get_list', args: {
            doctype: 'Daily Work Logs', fields: ['name','intern','date',
            'hours_worked','status','is_late'], limit: 500, order_by: 'date desc'
        }}),
        frappe.call({ method: 'frappe.client.get_list', args: {
            doctype: 'Mentor', fields: ['name','mentor_name','email'], limit: 50
        }})
    ]).then(function(results) {
        var interns = results[0].message || [];
        var logs    = results[1].message || [];
        var mentors = results[2].message || [];
        render_admin_page(page, interns, logs, mentors);
    });
};

function render_admin_page(page, interns, logs, mentors) {
    var total_interns  = interns.length;
    var active_interns = interns.filter(i => i.status === 'Active').length;
    var total_mentors  = mentors.length;
    var total_logs     = logs.length;
    var pending        = logs.filter(l => l.status === 'Submitted').length;
    var approved       = logs.filter(l => l.status === 'Approved').length;
    var late           = logs.filter(l => l.is_late).length;
    var low_att        = interns.filter(i => i.low_attendance).length;
    var total_hours    = Math.round(logs.reduce((s,l) => s+(l.hours_worked||0),0)*10)/10;

    page.main.html(`
    <div style="padding:24px;max-width:1100px;margin:0 auto;font-family:var(--font-stack)">

      <!-- Title -->
      <div style="margin-bottom:24px">
        <div style="font-size:24px;font-weight:700;color:var(--text-color)">
          ITMS Overview
        </div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:4px">
          System-wide summary across all interns and mentors
        </div>
      </div>

      <!-- Top Metrics -->
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:12px">
        ${acard('Active Interns', active_interns, '#3498db', total_interns+' total')}
        ${acard('Total Mentors', total_mentors, '#9b59b6', 'in system')}
        ${acard('Total Logs', total_logs, '#1abc9c', total_hours+'h logged')}
        ${acard('Pending Reviews', pending, '#f39c12', 'need attention')}
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:24px">
        ${acard('Approved Logs', approved, '#27ae60', Math.round(approved/Math.max(total_logs,1)*100)+'% approval')}
        ${acard('Late Submissions', late, '#e67e22', 'total late')}
        ${acard('Low Attendance', low_att, '#e74c3c', 'below 75%')}
        ${acard('Total Hours', total_hours+'h', '#2c3e50', 'all interns')}
      </div>

      <!-- Two column layout -->
      <div style="display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:16px;margin-bottom:16px">

        <!-- Interns Table -->
        <div style="background:var(--card-bg);border:1px solid var(--border-color);
            border-radius:12px;padding:20px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div style="font-size:14px;font-weight:600;color:var(--text-color)">All Interns</div>
            <button onclick="frappe.set_route('List','Intern')"
              style="font-size:12px;color:#3498db;background:none;border:none;cursor:pointer">
              Manage →
            </button>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
              <tr style="border-bottom:2px solid var(--border-color)">
                <th style="text-align:left;padding:6px 0;color:var(--text-muted);font-weight:500;font-size:10px;text-transform:uppercase">Intern</th>
                <th style="text-align:left;padding:6px 0;color:var(--text-muted);font-weight:500;font-size:10px;text-transform:uppercase">Mentor</th>
                <th style="text-align:left;padding:6px 0;color:var(--text-muted);font-weight:500;font-size:10px;text-transform:uppercase">Logs</th>
                <th style="text-align:left;padding:6px 0;color:var(--text-muted);font-weight:500;font-size:10px;text-transform:uppercase">Attendance</th>
              </tr>
            </thead>
            <tbody>
              ${interns.map(intern => {
                var intern_logs = logs.filter(l => l.intern === intern.name).length;
                var att = Math.round(intern.attendance_percentage || 0);
                var att_color = att >= 75 ? '#27ae60' : '#e74c3c';
                return `
                <tr style="border-bottom:1px solid var(--border-color);cursor:pointer"
                    onclick="frappe.set_route('Form','Intern','${intern.name}')">
                  <td style="padding:10px 0">
                    <div style="font-weight:500;color:var(--text-color)">${intern.intern_name||intern.name}</div>
                    <div style="font-size:10px;color:var(--text-muted)">${intern.status||''}</div>
                  </td>
                  <td style="padding:10px 0;color:var(--text-muted)">${intern.mentor||'—'}</td>
                  <td style="padding:10px 0;color:var(--text-color);font-weight:500">${intern_logs}</td>
                  <td style="padding:10px 0">
                    <div style="display:flex;align-items:center;gap:6px">
                      <div style="background:#eee;border-radius:20px;height:5px;width:50px;overflow:hidden">
                        <div style="width:${att}%;height:100%;background:${att_color};border-radius:20px"></div>
                      </div>
                      <span style="color:${att_color};font-weight:600">${att}%</span>
                    </div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Right Column -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Mentors -->
          <div style="background:var(--card-bg);border:1px solid var(--border-color);
              border-radius:12px;padding:20px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
              <div style="font-size:14px;font-weight:600;color:var(--text-color)">Mentors</div>
              <button onclick="frappe.set_route('List','Mentor')"
                style="font-size:12px;color:#3498db;background:none;border:none;cursor:pointer">
                Manage →
              </button>
            </div>
            ${mentors.map(m => {
              var m_interns = interns.filter(i => i.mentor === m.name).length;
              var m_pending = logs.filter(l => interns.filter(i=>i.mentor===m.name).map(i=>i.name).includes(l.intern) && l.status==='Submitted').length;
              return `
              <div style="display:flex;align-items:center;gap:10px;padding:10px 0;
                  border-bottom:1px solid var(--border-color);cursor:pointer"
                  onclick="frappe.set_route('Form','Mentor','${m.name}')">
                <div style="width:32px;height:32px;border-radius:50%;
                    background:linear-gradient(135deg,#e67e22,#e74c3c);
                    display:flex;align-items:center;justify-content:center;
                    color:#fff;font-size:13px;font-weight:700;flex-shrink:0">
                  ${(m.mentor_name||m.name).charAt(0).toUpperCase()}
                </div>
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:500;color:var(--text-color)">
                    ${m.mentor_name||m.name}
                  </div>
                  <div style="font-size:11px;color:var(--text-muted)">
                    ${m_interns} intern${m_interns!==1?'s':''}
                    ${m_pending>0?` · <span style="color:#f39c12">${m_pending} pending</span>`:''}
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>

          <!-- Status Breakdown -->
          <div style="background:var(--card-bg);border:1px solid var(--border-color);
              border-radius:12px;padding:20px">
            <div style="font-size:14px;font-weight:600;color:var(--text-color);margin-bottom:16px">
              Log Status Breakdown
            </div>
            ${[
              ['Approved', approved, '#27ae60'],
              ['Pending', pending, '#f39c12'],
              ['Rejected', logs.filter(l=>l.status==='Rejected').length, '#e74c3c'],
              ['Reviewed', logs.filter(l=>l.status==='Reviewed').length, '#3498db'],
            ].map(([label, count, color]) => {
              var pct = Math.round(count/Math.max(total_logs,1)*100);
              return `
              <div style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;
                    font-size:12px;margin-bottom:4px">
                  <span style="color:var(--text-color)">${label}</span>
                  <span style="color:${color};font-weight:600">${count} (${pct}%)</span>
                </div>
                <div style="background:#eee;border-radius:20px;height:6px;overflow:hidden">
                  <div style="width:${pct}%;height:100%;border-radius:20px;background:${color};
                      transition:width .3s"></div>
                </div>
              </div>`;
            }).join('')}
          </div>

        </div>
      </div>

      <!-- Recent Activity -->
      <div style="background:var(--card-bg);border:1px solid var(--border-color);
          border-radius:12px;padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div style="font-size:14px;font-weight:600;color:var(--text-color)">Recent Activity</div>
          <button onclick="frappe.set_route('List','Daily Work Logs')"
            style="font-size:12px;color:#3498db;background:none;border:none;cursor:pointer">
            View all →
          </button>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="border-bottom:2px solid var(--border-color)">
              <th style="text-align:left;padding:6px 0;color:var(--text-muted);font-weight:500;font-size:10px;text-transform:uppercase">Intern</th>
              <th style="text-align:left;padding:6px 0;color:var(--text-muted);font-weight:500;font-size:10px;text-transform:uppercase">Date</th>
              <th style="text-align:left;padding:6px 0;color:var(--text-muted);font-weight:500;font-size:10px;text-transform:uppercase">Hours</th>
              <th style="text-align:left;padding:6px 0;color:var(--text-muted);font-weight:500;font-size:10px;text-transform:uppercase">Status</th>
              <th style="text-align:left;padding:6px 0;color:var(--text-muted);font-weight:500;font-size:10px;text-transform:uppercase">Flag</th>
            </tr>
          </thead>
          <tbody>
            ${logs.slice(0,12).map(l => `
            <tr style="border-bottom:1px solid var(--border-color);cursor:pointer"
                onclick="frappe.set_route('Form','Daily Work Logs','${l.name}')">
              <td style="padding:9px 0;font-weight:500;color:var(--text-color)">${l.intern}</td>
              <td style="padding:9px 0;color:var(--text-muted)">${l.date}</td>
              <td style="padding:9px 0;color:var(--text-color)">${l.hours_worked||0}h</td>
              <td style="padding:9px 0">
                <span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:500;
                    background:${sbg(l.status)};color:${stxt(l.status)}">
                  ${l.status||'—'}
                </span>
              </td>
              <td style="padding:9px 0;color:${l.is_late?'#e74c3c':'var(--text-muted)'}">
                ${l.is_late?'⚑':'—'}
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

    </div>
    `);
}

function acard(label, value, color, sub) {
    return `
    <div style="background:var(--card-bg);border:1px solid var(--border-color);
        border-radius:10px;padding:16px">
      <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;
          letter-spacing:.05em;margin-bottom:6px">${label}</div>
      <div style="font-size:26px;font-weight:700;color:${color};margin-bottom:4px">${value}</div>
      <div style="font-size:11px;color:var(--text-muted)">${sub}</div>
    </div>`;
}

function sbg(s){return{Approved:'#d5f5e3',Rejected:'#fadbd8',Submitted:'#fef9e7',Reviewed:'#d6eaf8',Pending:'#f2f3f4'}[s]||'#f2f3f4';}
function stxt(s){return{Approved:'#1e8449',Rejected:'#922b21',Submitted:'#9a7d0a',Reviewed:'#1a5276',Pending:'#7f8c8d'}[s]||'#7f8c8d';}
