var moment = require('moment');
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var BookInstanceSchema = Schema({
	book: {type: Schema.ObjectId, ref: 'Book', required: true}, //reference to the associated book
	imprint: {type: String, required: true},
	status: {type: String, required: true, enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'], default: 'Maintenance'},
	due_back: {type: Date, default:Date.now}
});

//virtual for bookinstance url
BookInstanceSchema
.virtual('url')
.get(function () {
	return '/catalog/bookinstance/' + this._id;
});

//date virtual
BookInstanceSchema
.virtual('due_back_formatted')
.get(function () {
  return moment(this.due_back).format('MMMM DD, YYYY');
});

//export model
module.exports = mongoose.model('BookInstance', BookInstanceSchema);