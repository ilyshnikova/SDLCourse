#ifndef WIDGETS
#define WIDGETS
#include <QMainWindow>
#include <QPushButton>
#include <QLayout>
#include <QLabel>
#include <QApplication>

struct Object {
public:
	virtual const char* GetClassName() const = 0;

	virtual ~Object() {};
};

struct Widget : public QWidget, public Object {
	Q_OBJECT

public:
	explicit Widget(QWidget *parent = 0)
		: QWidget(parent)
	{}

	const char* GetClassName() const {
		return "Widget";
	}

	~Widget() {}

};

typedef void (NoArgumentsCallback)(struct Object *sender);


struct PushButton: public QPushButton, public Object {
	Q_OBJECT
public:
	PushButton(struct Widget *parent)
		: QPushButton(parent)
	{}

	const char* GetClassName() const {
		return "PushButton";
	}

	void setOnClicked(NoArgumentsCallback *callback) {
		connect(this, &QPushButton::clicked, [&]{callback(this);});
	}

	~PushButton() {}
};

struct Label: public QLabel, public Object {
	Q_OBJECT
public:
	Label(struct Widget *parent)
		: QLabel(parent)
	{}

	const char* GetClassName() const {
		return "Label";
	}

	~Label() {}
};

struct Application : public QApplication, public Object {
	Q_OBJECT
public:
	Application(int argc, char *argv[])
		: QApplication(argc, argv)
	{}

	const char* GetClassName() const {
		return "Application";
	}

	~Application() {}
};

struct Layout: public QLayout, public Object {
	Q_OBJECT
public:
	Layout(struct Widget *parent)
		: QLayout(parent)
	{}

	const char* GetClassName() const {
		return "Layout";
	}

	~Layout();

};
struct VBoxLayout: public QVBoxLayout, public Object {
	Q_OBJECT
public:
	VBoxLayout(struct Widget *parent)
		: QVBoxLayout(parent)
	{}

	const char* GetClassName() const {
		return "VBoxLayout";
	}

	~VBoxLayout() {}
};


const char* Object_GetClassName(struct Object *object);
void Object_Delete(struct Object *object);

struct Application* Application_New(int argc, char *argv[]);
int Application_Exec(struct Application *app);

struct VBoxLayout* VBoxLayout_New(struct Widget *parent);
void Layout_AddWidget(struct Layout *layout, struct Widget *widget);

struct Widget* Widget_New(struct Widget *parent);

void Widget_SetVisible(struct Widget *widget, bool v);
void Widget_SetWindowTitle(struct Widget *widget, const char *title);
void Widget_SetLayout(struct Widget *widget, struct Layout *layout);
void Widget_SetSize(struct Widget *widget, int w, int h);

struct Label* Label_New(struct Widget *parent);
void Label_SetText(struct Label *label, const char *text);

struct PushButton* PushButton_New(struct Widget *parent);
void PushButton_SetText(struct PushButton *button, const char *text);
void PushButton_SetOnClicked(struct PushButton *button, NoArgumentsCallback *callback);

#endif
