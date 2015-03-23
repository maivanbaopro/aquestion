var Answer = require('../models/answer');
var User = require('../models/user');
var Question = require('../models/question');
var Vote = require('../models/vote');
var Favorite = require('../models/favorite');
var nodemailer = require('nodemailer');

// Tạo đối tượng tái sử dụng transporter dùng SMTP transport
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'minhsang2603@gmail.com',
        pass: 'fit@dhcn123!@#'
    }
});

module.exports = function (app, passport) {
	app.post('/api/answer/create', function(req, res) {

		var newAnswer= new Answer();
    	newAnswer.userId=req.user._id;
    	newAnswer.questionId=req.body.question_id;
		newAnswer.content= req.body.content;
		newAnswer.creationDate= new Date();
    	newAnswer.save(function(err) {
            if (err)
                throw err;
            Question.findById(req.body.question_id).populate('userId').exec(function(err, q){
            	if(err)
            		res.send(err);
            	if(req.user._id!=q.userId._id){
            		var domain =req.headers.host || "azquestion.com";
	            	var mailOptions = {
					    from: 'Mạng xã hội hỏi đáp <azquestion.com@gmail.com>', // Địa chỉ người gửi
					    to: q.userId.email, //Danh sách người nhận, ngăn cách nhau bằng dấu phẩy
					    subject: 'Câu hỏi của bạn đã được trả lời', // Tiêu đề thư
					    //text: 'Hello world', // Nội dung thư dạng thường
					    html: '<p><strong>Chào '+q.userId.displayName+'.</strong></p> <p><strong>'+req.user.displayName+'</strong> vừa mới trả lời trong bài viết "<strong>'+q.title+'</strong>" của bạn.</p><p>Bạn có thể xem chi tiết câu trả lời &nbsp;<a href="http://' + domain + '/cau-hoi/chi-tiet/'+q._id+'/?email=true">tại đây</a></p>' // Nội dung dạng html
					};

					// gửi mail với đối tượng transporter đã được khai báo
					transporter.sendMail(mailOptions, function(error, info){
					    if(error){
					        console.log(error);
					    }else{
					        console.log('Message sent: ' + info.response);
					    }
					});
				}
            });
			Favorite.find({questionId: req.body.question_id}).populate('userId', 'email').populate('questionId').exec(function(err, list){
				if(err)
					res.send(err);
				list.forEach(function(item){
					if(item.userId._id!=req.user._id){
						var domain =req.headers.host || "azquestion.com";
						var mailOptions = {
						    from: 'Mạng xã hội hỏi đáp <azquestion.com@gmail.com>', // Địa chỉ người gửi
						    to: item.userId.email, //Danh sách người nhận, ngăn cách nhau bằng dấu phẩy
						    subject: 'Trả lời mới trong câu hỏi bạn quan tâm', // Tiêu đề thư
						    //text: 'Hello world', // Nội dung thư dạng thường
						    html: '<p><strong>Chào bạn, </strong></p> <p><strong>'+req.user.displayName+
						    '</strong> vừa mới trả lời trong bài viết "<strong>'+item.questionId.title+'</strong>" mà bạn đang theo dõi.</p>'+
						    '<p>Bạn có thể xem chi tiết câu trả lời &nbsp;<a href="http://' + domain +
						     '/cau-hoi/chi-tiet/'+item.questionId._id+'/?email=true">tại đây</a></p>' // Nội dung dạng html
						};

						// gửi mail với đối tượng transporter đã được khai báo
						transporter.sendMail(mailOptions, function(error, info){
						    if(error){
						        console.log(error);
						    }else{
						        console.log('Message sent: ' + info.response);
						    }
						});
					}
				});
			});
    		Answer.find({questionId: req.body.question_id}).populate('userId').exec(function(err, answers) {
				if (err)
					res.send(err)
				res.json(answers);
			});
		});
	});
	app.delete('/api/answer/detete/:answer_id', function(req, res) {
		var id = req.params.answer_id;
		Answer.remove({_id : id}, function(err, answers) {
			if (err)
				res.send(err);
			res.send(200);
		});
	});
	app.get('/api/answer', function(req, res){
		Answer.find({}, function(err, list){
			if(err)
				res.send(err);
			res.json(list);
		});
	});
	app.get('/api/answer/count/:question_id', function(req, res){
		Answer.count({questionId: req.params.question_id}, function(err, c){
			if(err)
				res.send(err);
			res.json(c);
		});
	});
	app.get('/api/answer/getAll', function(req, res){
		Answer.find({}).populate('userId questionId').exec(function(err, list){
			if(err)
				res.send(err);
			res.json(list);
		});
	});
	app.get('/api/answer/detail/:answer_id', function(req, res){
		Answer.findById(req.params.answer_id).populate('userId questionId').exec(function(err, answer){
			if(err)
				res.send(err);
			res.json(answer);
		});
	});
	app.get('/api/answer/acept/:answer_id', function(req, res){
		Answer.findById(req.params.answer_id, function(err, a){
			a.isAcepted=true;
			a.save(function(err, answer){
				if(err)
					res.send(err);
				User.findById(a.userId, function(err, user){
					if(err)
						res.send(err);
					user.reputation+=5;
					user.save(function(err,u){
						if(err)
							res.send(err);
					});
				});
				Question.findById(a.questionId, function(err, q){
					q.isResolved=true;
					q.save(function(err,question){
						if(err)
							res.send(err);
					});
				});
				Answer.find({questionId: a.questionId}).populate('userId').exec(function(err, qa){
					if(err)
						res.send(err);
					res.json(qa);
				});

			});
		});
	});
	app.get('/api/answer/getAnswerByUser/:user_id', function(req, res){
		Answer.find({userId: req.params.user_id}).populate("questionId").exec(function(err, list){
			if(err)
				res.send(err);
			res.json(list);
		});
	});

	// Thích câu trả lời
	app.get('/api/answer/vote_up/:answer_id', function(req, res){
		var id = req.params.answer_id;
		Vote.findOne( { $and: [ { answerId: id }, { userId: req.user._id } ] } )
		.exec(function(err,data){
			if(err)
				res.send(err);
			if(data!=null){
				if(data.type==true){
					Vote.remove({_id: data._id}, function(err, d){
						if(err)
							res.send(err);
						Answer.findById(id, function(err, answer){
							if(err)
								res.send(err);
							answer.score-=1;
							answer.save(function(err, a){
								if(err)
									res.send(err);
							});
						});
						res.json(d);
					});
				}
				else{
					Vote.remove({_id: data._id}, function(err, d){
						if(err)
							res.send(err);
						var vote = new Vote();
						vote.answerId=id;
						vote.userId= req.user._id;
						vote.type=true;
						vote.creationDate = new Date();
						vote.save(function(err, v){
							if(err)
								res.send(err);
							Answer.findById(id, function(err, answer){
								if(err)
									res.send(err);
								answer.score+=2;
								answer.save(function(err, a){
									if(err)
										res.send(err);
									res.json(a);
								});
							});
						});
					});
				}
			}
			else{
				var vote = new Vote();
				vote.answerId=id;
				vote.userId= req.user._id;
				vote.type=true;
				vote.creationDate = new Date();
				vote.save(function(err, v){
					if(err)
						res.send(err);
					Answer.findById(id, function(err, answer){
						if(err)
							res.send(err);
						answer.score+=1;
						answer.save(function(err, a){
							if(err)
								res.send(err);
							res.json(a);
						});
					});
				});
			}
		});
	});
	// Bỏ thích hoặc không thích câu trả lời
	app.get('/api/answer/vote_down/:answer_id', function(req, res){
		var id = req.params.answer_id;
		Vote.findOne( { $and: [ { answerId: id }, { userId: req.user._id } ] } )
		.exec(function(err,data){
			if(err)
				res.send(err);
			if(data!=null){
				if(data.type==false){
					Vote.remove({_id: data._id}, function(err, d){
						if(err)
							res.send(err);
						Answer.findById(id, function(err, answer){
							if(err)
								res.send(err);
							answer.score+=1;
							answer.save(function(err, a){
								if(err)
									res.send(err);
							});
						});
						res.json(d);
					});
				}
				else{
					Vote.remove({_id: data._id}, function(err, d){
						if(err)
							res.send(err);
						var vote = new Vote();
						vote.answerId=id;
						vote.userId= req.user._id;
						vote.type=false;
						vote.creationDate = new Date();
						vote.save(function(err, v){
							if(err)
								res.send(err);
							Answer.findById(id, function(err, answer){
								if(err)
									res.send(err);
								answer.score-=2;
								answer.save(function(err, a){
									if(err)
										res.send(err);
									res.json(a);
								});
							});
						});
					});
				}
			}
			else{
				var vote = new Vote();
				vote.answerId=id;
				vote.userId= req.user._id;
				vote.type=false;
				vote.creationDate = new Date();
				vote.save(function(err, v){
					if(err)
						res.send(err);
					Answer.findById(id, function(err, answer){
						if(err)
							res.send(err);
						answer.score-=1;
						answer.save(function(err, a){
							if(err)
								res.send(err);
							res.json(a);
						});
					});
				});
			}
		});
	});
}