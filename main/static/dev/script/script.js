window.apiCall = function(method, url, params, data, callback) {
  callback = callback || data || params;
  data = data || params;
  if (arguments.length === 4) {
    data = void 0;
  }
  if (arguments.length === 3) {
    params = void 0;
    data = void 0;
  }
  params = params || {};
  for (const key in params) {
    if (params[key] == null) {
      delete params[key];
    }
  }
  const separator = url.search('\\?') >= 0 ? '&' : '?';
  $.ajax({
    accepts: 'application/json',
    contentType: 'application/json',
    data: data ? JSON.stringify(data) : void 0,
    dataType: 'json',
    error(jqXHR, textStatus, errorThrown) {
      let error = {
        error_code: 'ajax_error',
        error_thrown: errorThrown,
        jqXHR,
        text_status: textStatus,
      };
      try {
        if (jqXHR.responseText) {
          error = $.parseJSON(jqXHR.responseText);
        }
      } catch (_error) {
        error = _error;
      }
      LOG('apiCall error', error);
      return typeof callback === 'function' ? callback(error) : void 0;
    },
    success(data_) {
      if (data_.status === 'success') {
        let more = void 0;
        if (data_.next_url) {
          more = callback_ => apiCall(method, data_.next_url, {}, callback);
        }
        return typeof callback === 'function'
          ? callback(void 0, data_.result, more)
          : void 0;
      }
      return typeof callback === 'function' ? callback(data) : void 0;
    },
    type: method,
    url: `${url}${separator}${$.param(params)}`,
  });
};

window.LOG = function() {
  return typeof console !== 'undefined' && console !== null
    ? typeof console.log === 'function'
      ? console.log(...arguments)
      : void 0
    : void 0;
};

window.initCommon = () => {
  initLoadingButton();
  initConfirmButton();
  initPasswordShowButton();
  initTime();
  initAnnouncement();
  initRowLink();
};

window.initLoadingButton = () =>
  $('body').on('click', '.btn-loading', function() {
    $(this).button('loading');
  });

window.initConfirmButton = () =>
  $('body').on('click', '.btn-confirm', function() {
    if (!confirm($(this).data('message') || 'Are you sure?')) {
      event.preventDefault();
    }
  });

window.initPasswordShowButton = () =>
  $('body').on('click', '.btn-password-show', function() {
    const $target = $($(this).data('target'));
    $target.focus();
    if ($(this).hasClass('active')) {
      $target.attr('type', 'password');
    } else {
      $target.attr('type', 'text');
    }
  });

window.initTime = () => {
  if ($('time').length > 0) {
    const recalculate = function() {
      $('time[datetime]').each(function() {
        const date = moment.utc($(this).attr('datetime'));
        const diff = moment().diff(date, 'days');
        if (diff > 25) {
          $(this).text(date.local().format('YYYY-MM-DD'));
        } else {
          $(this).text(date.fromNow());
        }
        $(this).attr(
          'title',
          date.local().format('dddd, MMMM Do YYYY, HH:mm:ss Z'),
        );
      });
      setTimeout(recalculate, 1000 * 45);
    };
    recalculate();
  }
};

window.initAnnouncement = () => {
  $('.alert-announcement button.close').click(
    () =>
      typeof sessionStorage !== 'undefined' && sessionStorage !== null
        ? sessionStorage.setItem(
            'closedAnnouncement',
            $('.alert-announcement').html(),
          )
        : void 0,
  );
  if (
    (typeof sessionStorage !== 'undefined' && sessionStorage !== null
      ? sessionStorage.getItem('closedAnnouncement')
      : void 0) !== $('.alert-announcement').html()
  ) {
    $('.alert-announcement').show();
  }
};

window.initRowLink = () => {
  $('body').on('click', '.row-link', function() {
    window.location.href = $(this).data('href');
  });
  $('body').on('click', '.not-link', event => event.stopPropagation());
};

window.clearNotifications = () => $('#notifications').empty();

window.showNotification = (message, category) => {
  if (category == null) {
    category = 'warning';
  }
  clearNotifications();
  if (!message) {
    return;
  }
  $('#notifications').append(
    `<div class="alert alert-dismissable alert-${category}"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>${message}</div>`,
  );
};

$(() => {
  initCommon();

  $('html.auth').each(() => {
    initAuth();
  });

  $('html.user-list').each(() => {
    initUserList();
  });

  $('html.user-merge').each(() => {
    initUserMerge();
  });
});

window.initAuth = () => {
  $('.remember').change(() => {
    let href;
    const buttons = $('.btn-social')
      .toArray()
      .concat($('.btn-social-icon').toArray());
    const remember = $('.remember input').is(':checked');
    for (const button of buttons) {
      href = $(button).prop('href');
      if (remember) {
        $(button).prop('href', `${href}&remember=true`);
      } else {
        $(button).prop('href', href.replace('&remember=true', ''));
      }
    }
  });
  $('.remember').change();
};

window.initUserList = () => {
  initUserSelections();
  initUserDeleteBtn();
  initUserMergeBtn();
};

const initUserSelections = () => {
  $('input[name=user_db]').each(function() {
    userSelectRow($(this));
  });
  $('#select-all').change(function() {
    $('input[name=user_db]').prop('checked', $(this).is(':checked'));
    $('input[name=user_db]').each(function() {
      userSelectRow($(this));
    });
  });
  $('input[name=user_db]').change(function() {
    userSelectRow($(this));
  });
};

const userSelectRow = $element => {
  updateUserSelections();
  $('input[name=user_db]').each(() => {
    const id = $element.val();
    $(`#${id}`).toggleClass('warning', $element.is(':checked'));
  });
};

const updateUserSelections = () => {
  const selected = $('input[name=user_db]:checked').length;
  $('#user-actions').toggleClass('hidden', selected === 0);
  $('#user-merge').toggleClass('hidden', selected < 2);
  if (selected === 0) {
    $('#select-all').prop('indeterminate', false);
    $('#select-all').prop('checked', false);
  } else if ($('input[name=user_db]:not(:checked)').length === 0) {
    $('#select-all').prop('indeterminate', false);
    $('#select-all').prop('checked', true);
  } else {
    $('#select-all').prop('indeterminate', true);
  }
};

const initUserDeleteBtn = () =>
  $('#user-delete').click(function(event) {
    clearNotifications();
    event.preventDefault();
    const confirmMessage = $(this)
      .data('confirm')
      .replace('{users}', $('input[name=user_db]:checked').length);
    if (confirm(confirmMessage)) {
      const user_keys = [];
      $('input[name=user_db]:checked').each(function() {
        $(this).attr('disabled', true);
        user_keys.push($(this).val());
      });
      const deleteUrl = $(this).data('api-url');
      const successMessage = $(this).data('success');
      const errorMessage = $(this).data('error');
      apiCall(
        'DELETE',
        deleteUrl,
        {
          user_keys: user_keys.join(','),
        },
        (err, result) => {
          if (err) {
            $('input[name=user_db]:disabled').removeAttr('disabled');
            showNotification(
              errorMessage.replace('{users}', user_keys.length),
              'danger',
            );
            return;
          }
          $(`#${result.join(', #')}`).fadeOut(function() {
            $(this).remove();
            updateUserSelections();
            showNotification(
              successMessage.replace('{users}', user_keys.length),
              'success',
            );
          });
        },
      );
    }
  });

window.initUserMerge = () => {
  const user_keys = $('#user_keys').val();
  const api_url = $('.api-url').data('api-url');
  apiCall(
    'GET',
    api_url,
    {
      user_keys,
    },
    (error, result) => {
      if (error) {
        LOG('Something went terribly wrong');
        return;
      }
      window.user_dbs = result;
      $('input[name=user_db]').removeAttr('disabled');
    },
  );
  $('input[name=user_db]').change(event => {
    const user_key = $(event.currentTarget).val();
    selectDefaultUser(user_key);
  });
};

const selectDefaultUser = user_key => {
  $('.user-row')
    .removeClass('success')
    .addClass('danger');
  $(`#${user_key}`)
    .removeClass('danger')
    .addClass('success');
  for (const user_db of user_dbs) {
    if (user_key === user_db.key) {
      $('input[name=user_key]').val(user_db.key);
      $('input[name=username]').val(user_db.username);
      $('input[name=name]').val(user_db.name);
      $('input[name=email]').val(user_db.email);
      break;
    }
  }
};

const initUserMergeBtn = () =>
  $('#user-merge').click(function(event) {
    event.preventDefault();
    const user_keys = [];
    $('input[name=user_db]:checked').each(function() {
      user_keys.push($(this).val());
    });
    const user_merge_url = $(this).data('user-merge-url');
    window.location.href = `${user_merge_url}?user_keys=${user_keys.join(',')}`;
  });

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbW1vbi9hcGkuanMiLCJjb21tb24vdXRpbC5qcyIsInNpdGUvYXBwLmpzIiwic2l0ZS9hdXRoLmpzIiwic2l0ZS91c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoic2NyaXB0LmpzIiwic291cmNlc0NvbnRlbnQiOlsid2luZG93LmFwaUNhbGwgPSBmdW5jdGlvbihtZXRob2QsIHVybCwgcGFyYW1zLCBkYXRhLCBjYWxsYmFjaykge1xuICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGRhdGEgfHwgcGFyYW1zO1xuICBkYXRhID0gZGF0YSB8fCBwYXJhbXM7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSA0KSB7XG4gICAgZGF0YSA9IHZvaWQgMDtcbiAgfVxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgIHBhcmFtcyA9IHZvaWQgMDtcbiAgICBkYXRhID0gdm9pZCAwO1xuICB9XG4gIHBhcmFtcyA9IHBhcmFtcyB8fCB7fTtcbiAgZm9yIChjb25zdCBrZXkgaW4gcGFyYW1zKSB7XG4gICAgaWYgKHBhcmFtc1trZXldID09IG51bGwpIHtcbiAgICAgIGRlbGV0ZSBwYXJhbXNba2V5XTtcbiAgICB9XG4gIH1cbiAgY29uc3Qgc2VwYXJhdG9yID0gdXJsLnNlYXJjaCgnXFxcXD8nKSA+PSAwID8gJyYnIDogJz8nO1xuICAkLmFqYXgoe1xuICAgIGFjY2VwdHM6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgIGRhdGE6IGRhdGEgPyBKU09OLnN0cmluZ2lmeShkYXRhKSA6IHZvaWQgMCxcbiAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgIGVycm9yKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgbGV0IGVycm9yID0ge1xuICAgICAgICBlcnJvcl9jb2RlOiAnYWpheF9lcnJvcicsXG4gICAgICAgIGVycm9yX3Rocm93bjogZXJyb3JUaHJvd24sXG4gICAgICAgIGpxWEhSLFxuICAgICAgICB0ZXh0X3N0YXR1czogdGV4dFN0YXR1cyxcbiAgICAgIH07XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoanFYSFIucmVzcG9uc2VUZXh0KSB7XG4gICAgICAgICAgZXJyb3IgPSAkLnBhcnNlSlNPTihqcVhIUi5yZXNwb25zZVRleHQpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgICAgZXJyb3IgPSBfZXJyb3I7XG4gICAgICB9XG4gICAgICBMT0coJ2FwaUNhbGwgZXJyb3InLCBlcnJvcik7XG4gICAgICByZXR1cm4gdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nID8gY2FsbGJhY2soZXJyb3IpIDogdm9pZCAwO1xuICAgIH0sXG4gICAgc3VjY2VzcyhkYXRhXykge1xuICAgICAgaWYgKGRhdGFfLnN0YXR1cyA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgIGxldCBtb3JlID0gdm9pZCAwO1xuICAgICAgICBpZiAoZGF0YV8ubmV4dF91cmwpIHtcbiAgICAgICAgICBtb3JlID0gY2FsbGJhY2tfID0+IGFwaUNhbGwobWV0aG9kLCBkYXRhXy5uZXh0X3VybCwge30sIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgPyBjYWxsYmFjayh2b2lkIDAsIGRhdGFfLnJlc3VsdCwgbW9yZSlcbiAgICAgICAgICA6IHZvaWQgMDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicgPyBjYWxsYmFjayhkYXRhKSA6IHZvaWQgMDtcbiAgICB9LFxuICAgIHR5cGU6IG1ldGhvZCxcbiAgICB1cmw6IGAke3VybH0ke3NlcGFyYXRvcn0keyQucGFyYW0ocGFyYW1zKX1gLFxuICB9KTtcbn07XG4iLCJ3aW5kb3cuTE9HID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiYgY29uc29sZSAhPT0gbnVsbFxuICAgID8gdHlwZW9mIGNvbnNvbGUubG9nID09PSAnZnVuY3Rpb24nXG4gICAgICA/IGNvbnNvbGUubG9nKC4uLmFyZ3VtZW50cylcbiAgICAgIDogdm9pZCAwXG4gICAgOiB2b2lkIDA7XG59O1xuXG53aW5kb3cuaW5pdENvbW1vbiA9ICgpID0+IHtcbiAgaW5pdExvYWRpbmdCdXR0b24oKTtcbiAgaW5pdENvbmZpcm1CdXR0b24oKTtcbiAgaW5pdFBhc3N3b3JkU2hvd0J1dHRvbigpO1xuICBpbml0VGltZSgpO1xuICBpbml0QW5ub3VuY2VtZW50KCk7XG4gIGluaXRSb3dMaW5rKCk7XG59O1xuXG53aW5kb3cuaW5pdExvYWRpbmdCdXR0b24gPSAoKSA9PlxuICAkKCdib2R5Jykub24oJ2NsaWNrJywgJy5idG4tbG9hZGluZycsIGZ1bmN0aW9uKCkge1xuICAgICQodGhpcykuYnV0dG9uKCdsb2FkaW5nJyk7XG4gIH0pO1xuXG53aW5kb3cuaW5pdENvbmZpcm1CdXR0b24gPSAoKSA9PlxuICAkKCdib2R5Jykub24oJ2NsaWNrJywgJy5idG4tY29uZmlybScsIGZ1bmN0aW9uKCkge1xuICAgIGlmICghY29uZmlybSgkKHRoaXMpLmRhdGEoJ21lc3NhZ2UnKSB8fCAnQXJlIHlvdSBzdXJlPycpKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgfSk7XG5cbndpbmRvdy5pbml0UGFzc3dvcmRTaG93QnV0dG9uID0gKCkgPT5cbiAgJCgnYm9keScpLm9uKCdjbGljaycsICcuYnRuLXBhc3N3b3JkLXNob3cnLCBmdW5jdGlvbigpIHtcbiAgICBjb25zdCAkdGFyZ2V0ID0gJCgkKHRoaXMpLmRhdGEoJ3RhcmdldCcpKTtcbiAgICAkdGFyZ2V0LmZvY3VzKCk7XG4gICAgaWYgKCQodGhpcykuaGFzQ2xhc3MoJ2FjdGl2ZScpKSB7XG4gICAgICAkdGFyZ2V0LmF0dHIoJ3R5cGUnLCAncGFzc3dvcmQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgJHRhcmdldC5hdHRyKCd0eXBlJywgJ3RleHQnKTtcbiAgICB9XG4gIH0pO1xuXG53aW5kb3cuaW5pdFRpbWUgPSAoKSA9PiB7XG4gIGlmICgkKCd0aW1lJykubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IHJlY2FsY3VsYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgICAkKCd0aW1lW2RhdGV0aW1lXScpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGRhdGUgPSBtb21lbnQudXRjKCQodGhpcykuYXR0cignZGF0ZXRpbWUnKSk7XG4gICAgICAgIGNvbnN0IGRpZmYgPSBtb21lbnQoKS5kaWZmKGRhdGUsICdkYXlzJyk7XG4gICAgICAgIGlmIChkaWZmID4gMjUpIHtcbiAgICAgICAgICAkKHRoaXMpLnRleHQoZGF0ZS5sb2NhbCgpLmZvcm1hdCgnWVlZWS1NTS1ERCcpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkKHRoaXMpLnRleHQoZGF0ZS5mcm9tTm93KCkpO1xuICAgICAgICB9XG4gICAgICAgICQodGhpcykuYXR0cihcbiAgICAgICAgICAndGl0bGUnLFxuICAgICAgICAgIGRhdGUubG9jYWwoKS5mb3JtYXQoJ2RkZGQsIE1NTU0gRG8gWVlZWSwgSEg6bW06c3MgWicpLFxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgICBzZXRUaW1lb3V0KHJlY2FsY3VsYXRlLCAxMDAwICogNDUpO1xuICAgIH07XG4gICAgcmVjYWxjdWxhdGUoKTtcbiAgfVxufTtcblxud2luZG93LmluaXRBbm5vdW5jZW1lbnQgPSAoKSA9PiB7XG4gICQoJy5hbGVydC1hbm5vdW5jZW1lbnQgYnV0dG9uLmNsb3NlJykuY2xpY2soXG4gICAgKCkgPT5cbiAgICAgIHR5cGVvZiBzZXNzaW9uU3RvcmFnZSAhPT0gJ3VuZGVmaW5lZCcgJiYgc2Vzc2lvblN0b3JhZ2UgIT09IG51bGxcbiAgICAgICAgPyBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKFxuICAgICAgICAgICAgJ2Nsb3NlZEFubm91bmNlbWVudCcsXG4gICAgICAgICAgICAkKCcuYWxlcnQtYW5ub3VuY2VtZW50JykuaHRtbCgpLFxuICAgICAgICAgIClcbiAgICAgICAgOiB2b2lkIDAsXG4gICk7XG4gIGlmIChcbiAgICAodHlwZW9mIHNlc3Npb25TdG9yYWdlICE9PSAndW5kZWZpbmVkJyAmJiBzZXNzaW9uU3RvcmFnZSAhPT0gbnVsbFxuICAgICAgPyBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKCdjbG9zZWRBbm5vdW5jZW1lbnQnKVxuICAgICAgOiB2b2lkIDApICE9PSAkKCcuYWxlcnQtYW5ub3VuY2VtZW50JykuaHRtbCgpXG4gICkge1xuICAgICQoJy5hbGVydC1hbm5vdW5jZW1lbnQnKS5zaG93KCk7XG4gIH1cbn07XG5cbndpbmRvdy5pbml0Um93TGluayA9ICgpID0+IHtcbiAgJCgnYm9keScpLm9uKCdjbGljaycsICcucm93LWxpbmsnLCBmdW5jdGlvbigpIHtcbiAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICQodGhpcykuZGF0YSgnaHJlZicpO1xuICB9KTtcbiAgJCgnYm9keScpLm9uKCdjbGljaycsICcubm90LWxpbmsnLCBldmVudCA9PiBldmVudC5zdG9wUHJvcGFnYXRpb24oKSk7XG59O1xuXG53aW5kb3cuY2xlYXJOb3RpZmljYXRpb25zID0gKCkgPT4gJCgnI25vdGlmaWNhdGlvbnMnKS5lbXB0eSgpO1xuXG53aW5kb3cuc2hvd05vdGlmaWNhdGlvbiA9IChtZXNzYWdlLCBjYXRlZ29yeSkgPT4ge1xuICBpZiAoY2F0ZWdvcnkgPT0gbnVsbCkge1xuICAgIGNhdGVnb3J5ID0gJ3dhcm5pbmcnO1xuICB9XG4gIGNsZWFyTm90aWZpY2F0aW9ucygpO1xuICBpZiAoIW1lc3NhZ2UpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgJCgnI25vdGlmaWNhdGlvbnMnKS5hcHBlbmQoXG4gICAgYDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1kaXNtaXNzYWJsZSBhbGVydC0ke2NhdGVnb3J5fVwiPjxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiY2xvc2VcIiBkYXRhLWRpc21pc3M9XCJhbGVydFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPiZ0aW1lczs8L2J1dHRvbj4ke21lc3NhZ2V9PC9kaXY+YCxcbiAgKTtcbn07XG4iLCIkKCgpID0+IHtcbiAgaW5pdENvbW1vbigpO1xuXG4gICQoJ2h0bWwuYXV0aCcpLmVhY2goKCkgPT4ge1xuICAgIGluaXRBdXRoKCk7XG4gIH0pO1xuXG4gICQoJ2h0bWwudXNlci1saXN0JykuZWFjaCgoKSA9PiB7XG4gICAgaW5pdFVzZXJMaXN0KCk7XG4gIH0pO1xuXG4gICQoJ2h0bWwudXNlci1tZXJnZScpLmVhY2goKCkgPT4ge1xuICAgIGluaXRVc2VyTWVyZ2UoKTtcbiAgfSk7XG59KTtcbiIsIndpbmRvdy5pbml0QXV0aCA9ICgpID0+IHtcbiAgJCgnLnJlbWVtYmVyJykuY2hhbmdlKCgpID0+IHtcbiAgICBsZXQgaHJlZjtcbiAgICBjb25zdCBidXR0b25zID0gJCgnLmJ0bi1zb2NpYWwnKVxuICAgICAgLnRvQXJyYXkoKVxuICAgICAgLmNvbmNhdCgkKCcuYnRuLXNvY2lhbC1pY29uJykudG9BcnJheSgpKTtcbiAgICBjb25zdCByZW1lbWJlciA9ICQoJy5yZW1lbWJlciBpbnB1dCcpLmlzKCc6Y2hlY2tlZCcpO1xuICAgIGZvciAoY29uc3QgYnV0dG9uIG9mIGJ1dHRvbnMpIHtcbiAgICAgIGhyZWYgPSAkKGJ1dHRvbikucHJvcCgnaHJlZicpO1xuICAgICAgaWYgKHJlbWVtYmVyKSB7XG4gICAgICAgICQoYnV0dG9uKS5wcm9wKCdocmVmJywgYCR7aHJlZn0mcmVtZW1iZXI9dHJ1ZWApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgJChidXR0b24pLnByb3AoJ2hyZWYnLCBocmVmLnJlcGxhY2UoJyZyZW1lbWJlcj10cnVlJywgJycpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICAkKCcucmVtZW1iZXInKS5jaGFuZ2UoKTtcbn07XG4iLCJ3aW5kb3cuaW5pdFVzZXJMaXN0ID0gKCkgPT4ge1xuICBpbml0VXNlclNlbGVjdGlvbnMoKTtcbiAgaW5pdFVzZXJEZWxldGVCdG4oKTtcbiAgaW5pdFVzZXJNZXJnZUJ0bigpO1xufTtcblxuY29uc3QgaW5pdFVzZXJTZWxlY3Rpb25zID0gKCkgPT4ge1xuICAkKCdpbnB1dFtuYW1lPXVzZXJfZGJdJykuZWFjaChmdW5jdGlvbigpIHtcbiAgICB1c2VyU2VsZWN0Um93KCQodGhpcykpO1xuICB9KTtcbiAgJCgnI3NlbGVjdC1hbGwnKS5jaGFuZ2UoZnVuY3Rpb24oKSB7XG4gICAgJCgnaW5wdXRbbmFtZT11c2VyX2RiXScpLnByb3AoJ2NoZWNrZWQnLCAkKHRoaXMpLmlzKCc6Y2hlY2tlZCcpKTtcbiAgICAkKCdpbnB1dFtuYW1lPXVzZXJfZGJdJykuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgIHVzZXJTZWxlY3RSb3coJCh0aGlzKSk7XG4gICAgfSk7XG4gIH0pO1xuICAkKCdpbnB1dFtuYW1lPXVzZXJfZGJdJykuY2hhbmdlKGZ1bmN0aW9uKCkge1xuICAgIHVzZXJTZWxlY3RSb3coJCh0aGlzKSk7XG4gIH0pO1xufTtcblxuY29uc3QgdXNlclNlbGVjdFJvdyA9ICRlbGVtZW50ID0+IHtcbiAgdXBkYXRlVXNlclNlbGVjdGlvbnMoKTtcbiAgJCgnaW5wdXRbbmFtZT11c2VyX2RiXScpLmVhY2goKCkgPT4ge1xuICAgIGNvbnN0IGlkID0gJGVsZW1lbnQudmFsKCk7XG4gICAgJChgIyR7aWR9YCkudG9nZ2xlQ2xhc3MoJ3dhcm5pbmcnLCAkZWxlbWVudC5pcygnOmNoZWNrZWQnKSk7XG4gIH0pO1xufTtcblxuY29uc3QgdXBkYXRlVXNlclNlbGVjdGlvbnMgPSAoKSA9PiB7XG4gIGNvbnN0IHNlbGVjdGVkID0gJCgnaW5wdXRbbmFtZT11c2VyX2RiXTpjaGVja2VkJykubGVuZ3RoO1xuICAkKCcjdXNlci1hY3Rpb25zJykudG9nZ2xlQ2xhc3MoJ2hpZGRlbicsIHNlbGVjdGVkID09PSAwKTtcbiAgJCgnI3VzZXItbWVyZ2UnKS50b2dnbGVDbGFzcygnaGlkZGVuJywgc2VsZWN0ZWQgPCAyKTtcbiAgaWYgKHNlbGVjdGVkID09PSAwKSB7XG4gICAgJCgnI3NlbGVjdC1hbGwnKS5wcm9wKCdpbmRldGVybWluYXRlJywgZmFsc2UpO1xuICAgICQoJyNzZWxlY3QtYWxsJykucHJvcCgnY2hlY2tlZCcsIGZhbHNlKTtcbiAgfSBlbHNlIGlmICgkKCdpbnB1dFtuYW1lPXVzZXJfZGJdOm5vdCg6Y2hlY2tlZCknKS5sZW5ndGggPT09IDApIHtcbiAgICAkKCcjc2VsZWN0LWFsbCcpLnByb3AoJ2luZGV0ZXJtaW5hdGUnLCBmYWxzZSk7XG4gICAgJCgnI3NlbGVjdC1hbGwnKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSk7XG4gIH0gZWxzZSB7XG4gICAgJCgnI3NlbGVjdC1hbGwnKS5wcm9wKCdpbmRldGVybWluYXRlJywgdHJ1ZSk7XG4gIH1cbn07XG5cbmNvbnN0IGluaXRVc2VyRGVsZXRlQnRuID0gKCkgPT5cbiAgJCgnI3VzZXItZGVsZXRlJykuY2xpY2soZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBjbGVhck5vdGlmaWNhdGlvbnMoKTtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IGNvbmZpcm1NZXNzYWdlID0gJCh0aGlzKVxuICAgICAgLmRhdGEoJ2NvbmZpcm0nKVxuICAgICAgLnJlcGxhY2UoJ3t1c2Vyc30nLCAkKCdpbnB1dFtuYW1lPXVzZXJfZGJdOmNoZWNrZWQnKS5sZW5ndGgpO1xuICAgIGlmIChjb25maXJtKGNvbmZpcm1NZXNzYWdlKSkge1xuICAgICAgY29uc3QgdXNlcl9rZXlzID0gW107XG4gICAgICAkKCdpbnB1dFtuYW1lPXVzZXJfZGJdOmNoZWNrZWQnKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKHRoaXMpLmF0dHIoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICAgIHVzZXJfa2V5cy5wdXNoKCQodGhpcykudmFsKCkpO1xuICAgICAgfSk7XG4gICAgICBjb25zdCBkZWxldGVVcmwgPSAkKHRoaXMpLmRhdGEoJ2FwaS11cmwnKTtcbiAgICAgIGNvbnN0IHN1Y2Nlc3NNZXNzYWdlID0gJCh0aGlzKS5kYXRhKCdzdWNjZXNzJyk7XG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSAkKHRoaXMpLmRhdGEoJ2Vycm9yJyk7XG4gICAgICBhcGlDYWxsKFxuICAgICAgICAnREVMRVRFJyxcbiAgICAgICAgZGVsZXRlVXJsLFxuICAgICAgICB7XG4gICAgICAgICAgdXNlcl9rZXlzOiB1c2VyX2tleXMuam9pbignLCcpLFxuICAgICAgICB9LFxuICAgICAgICAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAkKCdpbnB1dFtuYW1lPXVzZXJfZGJdOmRpc2FibGVkJykucmVtb3ZlQXR0cignZGlzYWJsZWQnKTtcbiAgICAgICAgICAgIHNob3dOb3RpZmljYXRpb24oXG4gICAgICAgICAgICAgIGVycm9yTWVzc2FnZS5yZXBsYWNlKCd7dXNlcnN9JywgdXNlcl9rZXlzLmxlbmd0aCksXG4gICAgICAgICAgICAgICdkYW5nZXInLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgJChgIyR7cmVzdWx0LmpvaW4oJywgIycpfWApLmZhZGVPdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKHRoaXMpLnJlbW92ZSgpO1xuICAgICAgICAgICAgdXBkYXRlVXNlclNlbGVjdGlvbnMoKTtcbiAgICAgICAgICAgIHNob3dOb3RpZmljYXRpb24oXG4gICAgICAgICAgICAgIHN1Y2Nlc3NNZXNzYWdlLnJlcGxhY2UoJ3t1c2Vyc30nLCB1c2VyX2tleXMubGVuZ3RoKSxcbiAgICAgICAgICAgICAgJ3N1Y2Nlc3MnLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgfVxuICB9KTtcblxud2luZG93LmluaXRVc2VyTWVyZ2UgPSAoKSA9PiB7XG4gIGNvbnN0IHVzZXJfa2V5cyA9ICQoJyN1c2VyX2tleXMnKS52YWwoKTtcbiAgY29uc3QgYXBpX3VybCA9ICQoJy5hcGktdXJsJykuZGF0YSgnYXBpLXVybCcpO1xuICBhcGlDYWxsKFxuICAgICdHRVQnLFxuICAgIGFwaV91cmwsXG4gICAge1xuICAgICAgdXNlcl9rZXlzLFxuICAgIH0sXG4gICAgKGVycm9yLCByZXN1bHQpID0+IHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBMT0coJ1NvbWV0aGluZyB3ZW50IHRlcnJpYmx5IHdyb25nJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHdpbmRvdy51c2VyX2RicyA9IHJlc3VsdDtcbiAgICAgICQoJ2lucHV0W25hbWU9dXNlcl9kYl0nKS5yZW1vdmVBdHRyKCdkaXNhYmxlZCcpO1xuICAgIH0sXG4gICk7XG4gICQoJ2lucHV0W25hbWU9dXNlcl9kYl0nKS5jaGFuZ2UoZXZlbnQgPT4ge1xuICAgIGNvbnN0IHVzZXJfa2V5ID0gJChldmVudC5jdXJyZW50VGFyZ2V0KS52YWwoKTtcbiAgICBzZWxlY3REZWZhdWx0VXNlcih1c2VyX2tleSk7XG4gIH0pO1xufTtcblxuY29uc3Qgc2VsZWN0RGVmYXVsdFVzZXIgPSB1c2VyX2tleSA9PiB7XG4gICQoJy51c2VyLXJvdycpXG4gICAgLnJlbW92ZUNsYXNzKCdzdWNjZXNzJylcbiAgICAuYWRkQ2xhc3MoJ2RhbmdlcicpO1xuICAkKGAjJHt1c2VyX2tleX1gKVxuICAgIC5yZW1vdmVDbGFzcygnZGFuZ2VyJylcbiAgICAuYWRkQ2xhc3MoJ3N1Y2Nlc3MnKTtcbiAgZm9yIChjb25zdCB1c2VyX2RiIG9mIHVzZXJfZGJzKSB7XG4gICAgaWYgKHVzZXJfa2V5ID09PSB1c2VyX2RiLmtleSkge1xuICAgICAgJCgnaW5wdXRbbmFtZT11c2VyX2tleV0nKS52YWwodXNlcl9kYi5rZXkpO1xuICAgICAgJCgnaW5wdXRbbmFtZT11c2VybmFtZV0nKS52YWwodXNlcl9kYi51c2VybmFtZSk7XG4gICAgICAkKCdpbnB1dFtuYW1lPW5hbWVdJykudmFsKHVzZXJfZGIubmFtZSk7XG4gICAgICAkKCdpbnB1dFtuYW1lPWVtYWlsXScpLnZhbCh1c2VyX2RiLmVtYWlsKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufTtcblxuY29uc3QgaW5pdFVzZXJNZXJnZUJ0biA9ICgpID0+XG4gICQoJyN1c2VyLW1lcmdlJykuY2xpY2soZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGNvbnN0IHVzZXJfa2V5cyA9IFtdO1xuICAgICQoJ2lucHV0W25hbWU9dXNlcl9kYl06Y2hlY2tlZCcpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB1c2VyX2tleXMucHVzaCgkKHRoaXMpLnZhbCgpKTtcbiAgICB9KTtcbiAgICBjb25zdCB1c2VyX21lcmdlX3VybCA9ICQodGhpcykuZGF0YSgndXNlci1tZXJnZS11cmwnKTtcbiAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGAke3VzZXJfbWVyZ2VfdXJsfT91c2VyX2tleXM9JHt1c2VyX2tleXMuam9pbignLCcpfWA7XG4gIH0pO1xuIl19
