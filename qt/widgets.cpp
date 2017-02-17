#include "widgets.h"

typedef void (NoArgumentsCallback)(struct Object *sender);

const char* Object_GetClassName(struct Object *object) {
	return object->GetClassName();
}

void Object_Delete(struct Object *object) {
	if (object) {
		delete object;
	}
}

struct Application* Application_New(int argc, char *argv[]) {
	return new Application(argc, argv);
}
int Application_Exec(struct Application *app) {
	return app->exec();
}

struct VBoxLayout* VBoxLayout_New(struct Widget *parent) {
	return new VBoxLayout(parent);
}
void Layout_AddWidget(struct Layout *layout, struct Widget *widget) {
	layout->addWidget(widget);
}

struct Widget* Widget_New(struct Widget *parent) {
	return new Widget(parent);
}

void Widget_SetVisible(struct Widget *widget, bool v) {
	widget->setVisible(v);
}

void Widget_SetWindowTitle(struct Widget *widget, const char *title) {
	widget->setWindowTitle(title);
}

void Widget_SetLayout(struct Widget *widget, struct Layout *layout) {
	widget->setLayout(layout);
}

void Widget_SetSize(struct Widget *widget, int w, int h) {
	widget->resize(w, h);
}

struct Label* Label_New(struct Widget *parent) {
	return new Label(parent);
}
void Label_SetText(struct Label *label, const char *text) {
	label->setText(text);
}

struct PushButton* PushButton_New(struct Widget *parent) {
	return new PushButton(parent);
}
void PushButton_SetText(struct PushButton *button, const char *text) {
	button->setText(text);
}

void PushButton_SetOnClicked(struct PushButton *button, NoArgumentsCallback *callback) {
	button->setOnClicked(callback);
}
