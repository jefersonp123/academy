export function requestContext(req, _res, next) {
  req.context = {
    userId: null,
    profileId: null,
    activeAcademyId: null,
    platformRole: null,
    academyRole: null,
    permissions: [],
  };
  next();
}
