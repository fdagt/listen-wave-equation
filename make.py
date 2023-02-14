import htmlmin
from jinja2 import Environment, FileSystemLoader
import rjsmin
import os

tasks = [{
    'type': 'html',
    'template': 'index.html',
    'dest': os.path.join('docs', 'index.html')
}, {
    'type': 'html',
    'template': 'how-to-use.html',
    'dest': os.path.join('docs', 'how-to-use.html')
}, {
    'type': 'js',
    'template': 'bundle.js',
    'dest': os.path.join('docs', 'bundle.js')
}]

env = Environment(loader=FileSystemLoader('template'))

def render_template(task, minify):
    template = env.get_template(task['template'])
    content = minify(template.render())
    with open(task['dest'], mode='w', encoding='utf-8') as dest:
        dest.write(content)
    print(f"has generated {task['dest']}")
    
def make_html(task):
    render_template(task, lambda text: htmlmin.minify(text, remove_comments=True))

def make_js(task):
    render_template(task, rjsmin.jsmin)
    
task_actions = { 'html': make_html, 'js': make_js }
                
for task in tasks:
    task_actions[task['type']](task)
