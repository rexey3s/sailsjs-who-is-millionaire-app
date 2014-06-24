/**
 * Allow any authenticated user.
 */
module.exports = function (req, res, next) {

  // User is allowed, proceed to controller
  if (req.session.authenticated && req.session.Admin.adminRole) {
    return next();
  }

  // User is not allowed
  else {
    var requireAdminError = [{name: 'requireAdminError', message: 'You must be an admin.'}]
    req.session.flash = {
      err: requireAdminError
    }
    res.redirect('/admin/login');
    return;
    // res.send(403);
  }
};
