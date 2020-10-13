var width = 360;
var height = 480;

d3.select("div")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

function addDanmaku(text, self, delay) {
    var e = d3.select("svg")
        .append("text")
        .text(text);
    if (self)
        e.style("text-decoration", "underline");
    e
        .attr("x", width)
        .attr("y", random(10, height))
        .transition()
        .delay(delay)
        .duration(4000)
        .ease(d3.easeLinear)
        .attr("x", -e.node().getComputedTextLength())
        .remove();
}

var chatRoom;
$.get("/getappkey", function (appkey) {
    if (!appkey) {
        debuglog("获取appkey失败");
    }
    debuglog("获得key", appkey);

    var im = RongIMLib.init({ appkey: appkey });
    var conversationList = []; // 当前已存在的会话列表
    im.watch({
        conversation: function (event) {
            var updatedConversationList = event.updatedConversationList; // 更新的会话列表
            debuglog("更新会话汇总:", updatedConversationList);
            debuglog("最新会话列表:", im.Conversation.merge({
                conversationList,
                updatedConversationList
            }));
        },
        message: function (event) {
            var message = event.message;
            debuglog("收到新消息:", message);
            if (message.isOffLineMessage) {
                if (message.senderUserId != "info") {
                    addDanmaku(message.content.content, false, random(0, 4000));
                }
            } else {
                addDanmaku(message.content.content, false, 0);
            }
        },
        status: function (event) {
            var status = event.status;
            debuglog("连接状态码:", status);
        }
    });
    $.get("/gettoken", function (token) {
        im.connect({
            token: token
        }).then(function (user) {
            debuglog("链接成功, 链接用户 id 为: ", user.id);
            //通知服务端离开
            window.onbeforeunload = function () {
                $.get("/exit?token=" + encodeURIComponent(token));
                return true;
            }
            //加入聊天室
            chatRoom = im.ChatRoom.get({
                id: "danmaku"
            });
            chatRoom.join({
                count: 10 // 进入后, 自动拉取 10 条聊天室最新消息
            }).then(function () {
                debuglog("加入聊天室成功");
            }).catch(function (error) {
                debuglog(error);
            });
        }).catch(function (error) {
            debuglog("链接失败: ", error.code, error.msg);
        });
    });
});

$("#send").click(function () {
    chatRoom.send({
        messageType: "RC:TxtMsg",
        content: {
            content: $("#text").val()
        }
    }).then(function (message) {
        addDanmaku(message.content.content, true, 0);
        debuglog("发送文字消息成功", message);
        $("#text").val("");
    });
});
//api测试
$("#test").click(function () {
    $.get("/test");
});

function random(a, b) {
    return a + (b - a) * Math.random();
}

function debuglog(a, b) {
    console.log(a, b);
}
