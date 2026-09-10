#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sync post copy from social-studio-posts.md into the social studio.

social-studio-posts.md is the single source of truth for LinkedIn post copy.
Edit the posts there, run this, and the studio's Copy post buttons pick up the
change. Nothing else in index.html is touched: the script only rewrites the
CARDS array between the CARDS:START and CARDS:END markers.

    python3 scripts/sync-social-posts.py
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MD = os.path.join(ROOT, 'social-studio-posts.md')
INDEX = os.path.join(ROOT, 'public', 'socials', 'index.html')

# file -> (group, title). Order here is the order on the studio page.
CARD_META = [
    ('card-audit-pledge.html',          'audit',    'The pledge'),
    ('card-audit-pledge-image.html',    'audit',    'The pledge · Photo'),
    ('card-audit-question.html',        'audit',    'The honest question'),
    ('card-audit-question-image.html',  'audit',    'The honest question · Photo'),
    ('card-audit-scope.html',           'audit',    'What the audit examines'),
    ('card-audit-readonly.html',        'audit',    'Read-only reassurance'),
    ('card-audit-findings.html',        'audit',    'The findings report'),
    ('card-audit-findings-image.html',  'audit',    'The findings report · Photo'),
    ('card-audit-cta.html',             'audit',    '100 audits, take one'),
    ('card-home.html',                  'home',     'Homepage'),
    ('card-home-image.html',            'home',     'Homepage · Photo'),
    ('card-managed-it.html',            'pillar',   'Managed IT'),
    ('card-managed-it-image.html',      'pillar',   'Managed IT · Photo'),
    ('card-cyber.html',                 'pillar',   'Cyber Security'),
    ('card-cyber-image.html',           'pillar',   'Cyber Security · Photo'),
    ('card-ai.html',                    'pillar',   'AI Enablement'),
    ('card-ai-image.html',              'pillar',   'AI Enablement · Photo'),
    ('card-recruitment.html',           'industry', 'Recruitment'),
    ('card-law-firms.html',             'industry', 'Law Firms'),
    ('card-accountancy.html',           'industry', 'Accountancy'),
    ('card-mkt-proof.html',             'mkt',      'Proof / Stats'),
    ('card-mkt-switch.html',            'mkt',      'Why firms switch'),
    ('card-mkt-review.html',            'mkt',      'Free IT Review (CTA)'),
    ('card-mkt-review-image.html',      'mkt',      'Free IT Review · Photo'),
    ('card-mkt-ops.html',               'mkt',      '24/7 Live Security Ops'),
    ('card-mkt-roots.html',             'mkt',      'Built inside recruitment'),
    ('card-mkt-microsoft.html',         'mkt',      'Microsoft Solutions Partner'),
]


def parse_posts(md):
    """Return {card_file: post_text} from the markdown."""
    posts = {}
    # split on level-2 headings, keeping the heading with its body
    chunks = re.split(r'\n(?=## )', md)
    for ch in chunks:
        if not ch.startswith('## '):
            continue
        head, _, body = ch.partition('\n')
        # Part 1 sections name their card on a **Card:** line
        m = re.search(r'\*\*Card:\*\*\s*`([^`]+)`', body)
        if m:
            card = m.group(1)
            body = body.split('\n', body.count('\n'))  # placeholder, replaced below
            body = ch.partition('\n')[2]
            body = re.sub(r'^.*?\*\*Card:\*\*[^\n]*\n', '', body, count=1, flags=re.S)
        else:
            # Part 2 sections name their card in the heading: "## card-home · ..."
            m2 = re.match(r'##\s+(card-[a-z0-9-]+)\s', head)
            if not m2:
                continue
            card = m2.group(1) + '.html'
        # body runs to the next horizontal rule
        body = body.split('\n---')[0]
        body = body.strip('\n').strip()
        if body:
            posts[card] = body
    return posts


def js_template(s):
    return s.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')


def main():
    md = io.open(MD, encoding='utf-8').read()
    posts = parse_posts(md)

    lines = []
    missing = []
    for f, group, title in CARD_META:
        # Photo variants (card-x-image.html) reuse their twin's post copy.
        cap = posts.get(f) or posts.get(re.sub(r'-image\.html$', '.html', f), '')
        if not cap:
            missing.append(f)
        if not os.path.exists(os.path.join(ROOT, 'public', 'socials', f)):
            sys.stderr.write('warning: card file not found: %s\n' % f)
        lines.append("      { group:'%s', file:'%s', title:%s, cap:`%s` },"
                     % (group, f, "'" + title.replace("'", "\\'") + "'", js_template(cap)))
    block = '\n'.join(lines)

    html = io.open(INDEX, encoding='utf-8').read()
    new, n = re.subn(r'(/\* CARDS:START \*/\n).*?([ \t]*/\* CARDS:END \*/)',
                     lambda m: m.group(1) + block + '\n' + m.group(2), html, flags=re.S)
    if n != 1:
        sys.exit('CARDS:START / CARDS:END markers not found in %s' % INDEX)
    io.open(INDEX, 'w', encoding='utf-8').write(new)

    print('synced %d cards, %d with post copy' % (len(CARD_META), len(CARD_META) - len(missing)))
    if missing:
        print('no post copy found for: %s' % ', '.join(missing))


if __name__ == '__main__':
    main()
