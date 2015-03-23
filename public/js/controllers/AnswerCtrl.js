angular.module('AnswerCtrl',[])

.controller('AnswerController',['$scope','$rootScope','$cookieStore','$location', '$http','flash','$modal','appAlert', 'Answer', function($scope,$rootScope,$cookieStore,$location, $http,flash,$modal,appAlert, Answer) {

	$scope.currentPage = 1;
    $scope.maxSize = 5;
    $scope.entryLimit = 10;
	$http.get('api/answer/getAll')
		.success(function(list){
			$scope.listAnswer=list;
		})
		.error(function(){
			console.log('error');
		});
	$scope.deleteAnswer = function(id, path) {
        appAlert.confirm({title:"Xóa",message:"Bạn chắc chắn muốn xóa câu trả lời này ?"},function(isOk){
            if(isOk){
                Answer.delete(id)
                    /*Nếu xóa thành công thì load lại dữ liệu*/
                    .success(function(data) {
                        flash.success="Xóa thành công!";
                         $http.get('api/answer/getAll')
							.success(function(list){
								$scope.listAnswer=list;
								$location.path(path);
							})
							.error(function(){
								console.log('error');
							});
                    });
                }
            });
        };
        $scope.acepted=function(id){
        	appAlert.confirm({title:"Xác nhận",message:"Bạn có chắc chắn muốn đánh dấu câu trả lời này là đúng?"+
        		"Bạn chỉ được đánh dấu trả lời đúng 1 lần và không thể sửa."},function(isOk){
	            if(isOk){
		        	$http.get('api/answer/acept/'+id)
		        		.success(function(data){
		        			$scope.listAnswerQuestion=data;
		        			$http.get('api/question/detail/'+ data[0].questionId)
						        .success(function(data){
						            if(!data.status)
						                $state.go("404");
						            $scope.questionDetail=data;
						        });
		        		});
		        	flash.success = "Bạn đã đánh dấu câu trả lời chính xác!";
		        }
		    });
        };
        $scope.listAllVote=[];
        $http.get('api/user/vote/all').success(function(all){$scope.listAllVote=all;}).error(function(){console.log('error');});
        $scope.voteUp=function(id, question_id){
	        $http.get('/loggedin').success(function(isLogin){
	            if(isLogin!=='0'){
	                $http.get('api/answer/vote_up/'+id)
	                    .success(function(data){
	                        if(parseInt(data)==1)
	                            flash.success="Bạn đã BỎ thích câu trả lời này!";
	                        else
	                            flash.success="Bạn đã thích câu trả lời này!";
	                        $http.get('api/findAnswers/'+ question_id)
						        .success(function(data){
						          $scope.listAnswerQuestion=data;
						        })
						        .error(function(){
						        console.log("error");
						    });
	                        $http.get('api/user/vote')
	                            .success(function(vote){
	                                $scope.listVote=vote;
	                            })
	                            .error(function() {
	                                console.log('error');
	                            });
	                        $http.get('api/user/vote/all').success(function(all){$scope.listAllVote=all;}).error(function(){console.log('error');});
	                    })
	                    .error(function(){
	                        console.log('error');
	                    });
	            }

	            else{
	                flash.error='Bạn cần đăng nhập để bình chọn !';
	            }
	        });
	    };
	    $scope.voteDown=function(id,question_id){
	        $http.get('/loggedin').success(function(isLogin){
	            if(isLogin!=='0'){
	                $http.get('api/answer/vote_down/'+id)
	                    .success(function(data){
	                        if(parseInt(data)==1)
	                            flash.success="Bạn đã BỎ không thích câu trả lời này!";
	                        else
	                            flash.success="Bạn Không thích câu trả lời này!";
	                        $http.get('api/findAnswers/'+ question_id)
						        .success(function(data){
						          $scope.listAnswerQuestion=data;
						        })
						        .error(function(){
						        console.log("error");
						    });
	                        $http.get('api/user/vote')
	                            .success(function(vote){
	                                $scope.listVote=vote;
	                            })
	                            .error(function() {
	                                console.log('error');
	                            });
	                        $http.get('api/user/vote/all').success(function(all){$scope.listAllVote=all;}).error(function(){console.log('error');});
	                    })
	                    .error(function(){
	                      flash.error="Có lỗi trong quá trình thực hiện bình chọn. Vui lòng thử lại sau!";
	                    });
	            }

	            else{
	                flash.error='Bạn cần đăng nhập để bình chọn !';
	            }
	        });
	    };
}])
.controller('AnswerDetail',['$scope','$http', '$stateParams', function ($scope,$http, $stateParams) {
	$http.get('api/answer/detail/'+$stateParams.id)
		.success(function(data){
			$scope.answer=data;
		})
		.error(function(){
			console.log('error');
		});
}]);