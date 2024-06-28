import passport from "passport";

export async function authOptional (req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
}

export async function authMandatory (req, res, next) {
  passport.authenticate( "jwt", {session: false})(req, res, next);
};