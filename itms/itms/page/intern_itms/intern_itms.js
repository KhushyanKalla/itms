frappe.pages['intern-itms'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'My Performance',
		single_column: true
	});
}