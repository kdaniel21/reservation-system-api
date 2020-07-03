module.exports = class APIFeatures {
  constructor(query, queryString, defaultSortBy) {
    this.query = query;
    this.queryString = queryString;
    this.defaultSortBy = defaultSortBy || '-createdAt';
  }

  filter() {
    const filters = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete filters[el]);

    let filtersString = JSON.stringify(filters);
    filtersString = filtersString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(filtersString));

    return this;
  }

  sort() {
    let sortBy = this.defaultSortBy;

    if (this.queryString.sort)
      sortBy = this.queryString.sort.replace(/,/g, ' ');

    this.query.sort(sortBy);

    return this;
  }

  limit() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.replace(/,/g, ' ');
      this.query = this.query.limit(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
};
