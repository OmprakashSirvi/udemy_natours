class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const queryObj = { ...this.queryString };
    // Created a hard copy of req.query object
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    // These fields should be deleted
    excludeFields.forEach((ele) => {
      delete queryObj[ele];
    });
    // Here filtering our query
    // This is actual query we want {difficulty : 'easy', duration : {$gte : 5}}
    // what we get.. { duration: { gte: '5' } } { duration: { gte: '5' } }
    // The idea is to replace all operators in express with orignal one
    // eg find these [gte, lte, lt, gt, etc...] and replace these with..
    // [$gte, $lte, $gt, $lt]
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|lte|gt|lt)\b/g, (match) => `$${match}`);

    // In future we will be chaining different methods in this so i did this..

    this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const regex = /,/gm;
      const str = this.queryString.sort;
      const subst = ` `;
      // The substituted value will contain in the result variable
      const sortBy = str.replace(regex, subst);
      // Another way..
      // const sortBy = req.query.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query.sort('-createdAt');
    }
    return this;
  }

  fieldLimit() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query.select('-__v');
    }
    return this;
  }

  pagintate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 50;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
