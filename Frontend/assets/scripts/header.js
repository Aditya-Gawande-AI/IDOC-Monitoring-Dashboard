// Auto-open the correct submenu and highlight on page load
$(function() {
    var currentPage = window.location.pathname.split('/').pop();
    var $currentLink = $(".submenu-link[data-url='" + currentPage + "']");
    if ($currentLink.length) {
        var $submenu = $currentLink.closest('.submenu');
        var $mainMenu = $(".main-menu[data-target='" + $submenu.attr('id') + "']");
        $submenu.show();
        $mainMenu.addClass('active');
        $currentLink.addClass('active');
    }
});
// Sidebar menu expand/collapse and navigation logic
$(document).on('click', '.main-menu', function(e) {
    e.preventDefault();
    var target = $(this).data('target');
    // Close all other submenus and remove active class
    $('.submenu').not('#' + target).slideUp(200);
    $('.main-menu').not(this).removeClass('active');
    // Toggle the clicked submenu
    $('#' + target).slideToggle(200);
    $(this).toggleClass('active');
});

$(document).on('click', '.submenu-link', function(e) {
    e.preventDefault();
    var url = $(this).data('url');
    // Highlight the parent main menu and keep submenu open
    var $submenu = $(this).closest('.submenu');
    var $mainMenu = $(".main-menu[data-target='" + $submenu.attr('id') + "']");
    $('.main-menu').removeClass('active');
    $mainMenu.addClass('active');
    // Only close other submenus, not the current one
    $('.submenu').not($submenu).slideUp(200);
    $submenu.stop(true, true).slideDown(0, function() {
        // After keeping open, if navigating, do it after a short delay to allow the menu to stay open visually
        if (url && url !== '#') {
            setTimeout(function() {
                window.location.href = url;
            }, 100);
        }
    });
    // If not navigating, submenu stays open
});

// Mobile sidebar toggle logic
$(document).on('click', '.mobile-toggle-nav', function() {
    $('body').toggleClass('sidebar-mobile-open');
});

// Sidebar hide/show logic for hamburger button (copied from main.js)
$(document).on('click', '#closeSidebarBtn', function() {
    var t = $(this).attr('data-class');
    var $appContainer = window.parent && window.parent.$ ? window.parent.$('.app-container') : $('.app-container');
    $appContainer.toggleClass(t);
    var n = $(this);
    n.hasClass('is-active') ? n.removeClass('is-active') : n.addClass('is-active');
});
