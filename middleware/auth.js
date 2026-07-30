module.exports = {
  requireAuth: (req, res, next) => {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
    next();
  },

  redirectIfAuth: (req, res, next) => {
    if (req.session.userId) {
      return res.redirect('/swiper');
    }
    next();
  }
};
