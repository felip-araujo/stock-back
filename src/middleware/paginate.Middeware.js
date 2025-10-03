export const paginate = (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  req.pagination = {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit
  };

  next();
};
