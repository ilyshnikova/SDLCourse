function call_or_get(object, context) {
	if (jQuery.isFunction(object)) {
		return object(context);
	} else {
		return object;
	}
}

function State(params) {
	this.params = params;
	this.context = new Object();
	this.enter_state('start');
}

State.prototype.enter_state = function (state) {
	this.init_context(state);
	this.context.after_on_enter = [];
	if (!this.params[state]) {
		throw new Error("State " + state + " undefined");
	}
	if (!this.params[state].on_enter) {
		throw new Error("Undefined on_enter of state " + state);
	}
	this.params[state].on_enter(this.context);
	this.state = state;
	for (var index = 0; index < this.context.after_on_enter.length; ++index) {
		this.context.after_on_enter[index]();
	}
}

State.prototype.init_context = function (state) {
	var _this = this;
	this.context.state = state;
	this.context.next = function (new_state) {
		if (_this.state === state) {
			_this.state = 'locked';
			_this.params[state].on_exit(_this.context);
			_this.enter_state(new_state);
		}
	}

	this.context.substate = function (new_state) {
		if (_this.state === state) {
			_this.state = 'locked';
			_this.context = {"parent" : _this.context};
			_this.enter_state(new_state);
		}
	}

	this.context.exit_state = function (new_state, depth) {
		if (_this.state === state) {
			_this.state = 'locked';
			_this.params[state].on_exit(_this.context);
			for (var index = 0; index < depth; ++index) {
				_this.context = _this.context.parent;
				_this.params[_this.context.state].on_exit(_this.context);
			}
			_this.enter_state(new_state);
		}
	}
}

State.go_to = function (context, params) {
	if (params.new_state !== undefined) {
		var type = call_or_get(params.type, context);
		var new_state = call_or_get(params.new_state, context);

		var depth = undefined;
		if (params.depth) {
			depth = call_or_get(params.depth, context);
		} else {
			depth = 1;
		}

		if (type == 'next') {
			context.next(new_state);
		} else if (type == 'substate') {
			context.substate(new_state);
		} else if (type == 'exit_state') {
			context.exit_state(new_state, depth);
		} else {
			throw new Error("unsupported transaction type" + type);
		}
	}
}


//
function Binder(params) {
	this.params = params;
}

Binder.prototype.on_enter = function (context) {
	var _this = this;
	this.target = call_or_get(this.params.target, context);
	this.func = function () {
		context[_this.params.write_to || 'actor'] = $(this);
		State.go_to(context, _this.params);
	};

	this.target.bind(this.params.action, this.func);
}

Binder.prototype.on_exit = function (context) {
	this.target.unbind(this.params.action, this.func);
}

//
function Executer(params) {
	this.params = params;
}

Executer.prototype.on_enter = function (context) {
	this.params(context);
}

Executer.prototype.on_exit = function (context) {

}

//
Builder.container_id = 0;
function Builder(params) {
	this.params = params;
	this.id = ++Builder.container_id;
}

Builder.prototype.on_enter = function (context) {
	this.container = call_or_get(this.params.container, context);
	this.container.append(
		'<div'
			+ ' id=inner_container' + this.id
		+ '>'
		+ '</div>'
	);

	this.params.func(context, $('#inner_container' + this.id));
}

Builder.prototype.on_exit = function (context) {
	 $('#inner_container' + this.id).remove();
}

//
function Combine(params) {
	this.params = params;
}

Combine.prototype.on_enter = function (context) {
	for (var index = 0; index < this.params.length; ++index) {
		this.params[index].on_enter(context);
	}
}

Combine.prototype.on_exit = function (context) {
	for (var index = this.params.length - 1; index >=0; --index) {
		this.params[index].on_exit(context);
	}
}

//
function BDialog(params) {
	this.params = params;
}

BDialog.prototype.on_enter = function(context) {
	$('body').append(
		'<div class="my-modal-dialog">'
			+' <div class="modal fade" '
				+'id="'
			       		+  call_or_get(this.params.id, context)
				+'" role="dialog">'
    				+'<div class="modal-dialog">'
					+'<div class="modal-content">'
						+ '<div class="modal-header">'
							+ '<button id=close type="button" class="close" >&times;</button>'
							+ '<h4 class="modal-title">'
								+ call_or_get(this.params.title, context)
							+'</h4>'
						+ '</div>'
						+ '<div class="modal-body">'
							+ '<p>'
								+ call_or_get(this.params.data, context)
							+ '</p>'

						+ '</div>'
						+ '<div class="modal-footer">'
							+ call_or_get(this.params.buttons)
						+ '</div>'
					+ '</div>'
				+'</div>'
			+ '</div>'
		+ '</div>'
	);
	$('#' + this.params.id).modal('show').unbind('click');

}

BDialog.prototype.on_exit = function(context) {
	$('.my-modal-dialog').remove();
	$('.modal-backdrop').remove();
	$('body').removeClass('modal-open');
}

//
function Dialog(params) {
	this.params = params;
}

Dialog.prototype.on_enter = function(context) {
	var _this = this;
	this.target = call_or_get(this.params.target, context);
	this.target.dialog({
		'modal' : true,
		'buttons' : {
			'Ok' : function() {
			}
		},
	});
	$('.close').unbind('click');
}

Dialog.prototype.on_exit = function(context) {
	this.target.dialog("destroy");
}

//
function GoTo(params) {
	this.params = params;
}

GoTo.prototype.on_enter = function(context) {
	var _this = this;
	context.after_on_enter.push(function () {
		State.go_to(context, _this.params);
	});
}

GoTo.prototype.on_exit = function(context) {
}

//
function SendQuery(params) {
	this.params = params;
}

SendQuery.prototype.on_enter = function(context) {
	var _this = this;
	var form_data = new FormData();

	if (this.params.ajax_data) {
		ajax_data = this.params.ajax_data(context);
		ajax_data['client'] = 'browser';
		form_data.append('json', JSON.stringify(ajax_data));
//		form_data = {"json" : JSON.stringify(ajax_data)};
	}

	if (this.params.file_input) {
		var file_input = call_or_get(this.params.file_input, context);
		var files = file_input[0].files;
		for (var index = 0; index < files.length; ++index) {
			var file = files[index];
			form_data.append('file' + index, file, '1.txt');
		}
	}

	this.started = 0;
	this.aborted = false;
	this.ajax = $.ajax({
		url: "/fcgi-bin/",
		data: form_data,
		cache: false,
		contentType: false,
		processData: false,
		type: 'POST',
		success: function(response) {
			_this.started = 1;
			if (response.status) {
				context[_this.params.write_to || 'response'] = response.data;
				State.go_to(context, _this.params)
			} else {
				alert(response.error);
				throw new Error(response.error);
			}

		},
		error: function (undefined, undefined, error) {
			_this.started = 1;
			if (!_this.aborted) {
				alert(error);
				throw new Error(error);
			}
		},
	});

}

SendQuery.prototype.on_exit = function(context) {
	if (!this.started && this.ajax !== undefined) {
		this.aborted = true;
		this.ajax.abort();
	}
}

function Enabler(params) {
	this.params = params;
}

Enabler.prototype.on_enter = function(context) {
	this.target = call_or_get(this.params.target, context);
	this.target.removeAttr('disabled');
}

Enabler.prototype.on_exit = function(context) {
	this.target.attr('disabled', 'disabled');
}

function BootstratpEnabler(params) {
	this.params = params;
}

BootstratpEnabler.prototype.on_enter = function(context) {
	this.target = call_or_get(this.params.target, context);
	this.target.removeClass("disabled");
}

BootstratpEnabler.prototype.on_exit = function(context) {
	this.target.addClass("disabled");
}

//
function SwitchToSelectMode(params) {
	this.params = params;
}

SwitchToSelectMode.prototype.on_enter = function (context) {
	this.params.graph(context).stop_dragging();
	this.params.graph(context).enable_select_mode();
}

SwitchToSelectMode.prototype.on_exit = function (context) {
	this.params.graph(context).start_dragging();
	this.params.graph(context).disable_select_mode();
}

function HTMLReplacer(params) {
	this.params = params;
}

HTMLReplacer.prototype.on_enter = function(context) {
	this.target = call_or_get(this.params.target, context);
	this.new_html = call_or_get(this.params.new_html, context);
	this.old_html = this.target.html();
	this.target.html(this.new_html);
}

HTMLReplacer.prototype.on_exit = function(context) {
	this.target.html(this.old_html);
}

function Timer(params) {
	this.params = params;
}

Timer.prototype.on_enter = function(context) {
	_this = this;
	this.started = 0;
	this.timer = setTimeout(
		function() {
			_this.started = 1;
			State.go_to(context, _this.params);
		},
		this.params.timeout * 1000
	);
}

Timer.prototype.on_exit = function(context) {
	if (!this.started && this.timer) {
		clearTimeout(this.timer);
	}
}


/*new Combine([
	new Binder({
		'action' : 'click',
		'type' : 'next',
	    	'new_state' : 'smth'
	}),
	...
])*/
