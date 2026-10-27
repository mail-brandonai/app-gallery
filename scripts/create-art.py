from pathlib import Path
out=Path(__file__).resolve().parents[1]/'site/assets'
for mode in ['day','rain','night']:
 sky={'day':['#d2eceb','#edf2de'],'rain':['#859eae','#c9dae0'],'night':['#172c45','#4d6278']}[mode]
 hill={'day':['#b4cbb2','#8eb49a','#739a84'],'rain':['#97b0aa','#739690','#567c78'],'night':['#687b83','#425c65','#304a54']}[mode]
 skybits=''
 if mode=='day':
  skybits='<circle cx="755" cy="152" r="97" fill="#f9e8b1" opacity=".4"/><circle cx="755" cy="152" r="65" fill="#f3cd78"/>'
 elif mode=='night':
  skybits='<path d="M765 82a62 62 0 1 0 36 109 55 55 0 0 1-36-109" fill="#f6e4af"/>'
  for i in range(32):skybits+=f'<circle cx="{i*137%980+10}" cy="{i*53%300+30}" r="{1+i%3}" fill="#e4e8e6" opacity="{.35+(i%4)*.15}"/>'
 else:
  for x,y in [(145,120),(680,95),(840,215)]:skybits+=f'<g fill="#dee7e7" opacity=".5"><ellipse cx="{x}" cy="{y}" rx="115" ry="30"/><ellipse cx="{x-30}" cy="{y-15}" rx="65" ry="33"/></g>'
  for i in range(40):
   x=i*73%1000;y=i*91%500
   skybits+=f'<path d="M{x} {y}l-8 24" stroke="#e4eff0" stroke-width="3" stroke-linecap="round" opacity=".5"/>'
 if mode=='day':
  body='''<path d="M471 451q-24-43-40-60m98 60q24-43 40-60" fill="none" stroke="#375b4d" stroke-width="6" stroke-linecap="round"/><ellipse cx="422" cy="393" rx="25" ry="12" transform="rotate(35 422 393)" fill="#628c68"/><ellipse cx="576" cy="395" rx="25" ry="12" transform="rotate(-35 576 395)" fill="#628c68"/><ellipse cx="461" cy="604" rx="27" ry="12" fill="#d6dbc0"/><ellipse cx="537" cy="604" rx="27" ry="12" fill="#d6dbc0"/><ellipse cx="500" cy="527" rx="77" ry="88" fill="url(#body)"/>'''
 elif mode=='rain':
  body='''<path d="M500 445v-30" stroke="#385664" stroke-width="6"/><circle cx="500" cy="410" r="8" fill="#f1d993"/><rect x="420" y="450" width="160" height="157" rx="46" fill="#accfd4"/><rect x="437" y="466" width="126" height="112" rx="35" fill="#deebe0"/><circle cx="436" cy="589" r="6" fill="#6d969c"/><circle cx="564" cy="589" r="6" fill="#6d969c"/><rect x="445" y="602" width="30" height="12" rx="6" fill="#709195"/><rect x="525" y="602" width="30" height="12" rx="6" fill="#709195"/>'''
 else:
  body='''<circle cx="500" cy="514" r="115" fill="#c7c1ee" opacity=".06"/><circle cx="500" cy="514" r="91" fill="#c7c1ee" opacity=".09"/><circle cx="500" cy="514" r="72" fill="url(#orb)"/><ellipse cx="500" cy="526" rx="109" ry="24" fill="none" stroke="#c6b8e5" stroke-width="4" transform="rotate(-18 500 526)" opacity=".7"/><circle cx="607" cy="491" r="7" fill="#eadfb9"/><circle cx="399" cy="546" r="5" fill="#b7c8e3"/>'''
 face='''<ellipse cx="476" cy="520" rx="5" ry="7" fill="#35574e"/><ellipse cx="523" cy="520" rx="5" ry="7" fill="#35574e"/><path d="M489 542q11 9 22 0" fill="none" stroke="#35574e" stroke-width="4" stroke-linecap="round"/>'''
 if mode=='night':face=face.replace('#35574e','#48496c')
 leaves=''
 for side in [0,1]:
  for i in range(7):
   x=45+i*19 if not side else 955-i*19;y=665+(i%3)*13
   leaves+=f'<path d="M{x} {y}q-5-30 {i%3*8-8}-60" fill="none" stroke="{hill[2]}" stroke-width="3"/><ellipse cx="{x-6}" cy="{y-34}" rx="14" ry="5" fill="{hill[2]}" transform="rotate(35 {x-6} {y-34})"/>'
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 720" role="img" aria-labelledby="title"><title id="title">Daylight {mode} scene illustration</title><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="{sky[0]}"/><stop offset="1" stop-color="{sky[1]}"/></linearGradient><linearGradient id="body" x2="1" y2="1"><stop stop-color="#fff9e4"/><stop offset="1" stop-color="#ece9ce"/></linearGradient><radialGradient id="orb" cx=".35" cy=".3"><stop stop-color="#f0e6f9"/><stop offset="1" stop-color="#b4a6df"/></radialGradient></defs><path fill="url(#sky)" d="M0 0h1000v720H0z"/>{skybits}<path d="M0 435Q160 310 360 433T700 401T1000 420V720H0Z" fill="{hill[0]}"/><path d="M0 540Q230 395 490 510T1000 490V720H0Z" fill="{hill[1]}"/><path d="M0 643Q320 567 570 641T1000 602V720H0Z" fill="{hill[2]}" opacity=".42"/><ellipse cx="500" cy="614" rx="89" ry="13" fill="#183c37" opacity=".13"/>{body}{face}{leaves}</svg>'''
 (out/f'daylight-{mode}.svg').write_text(svg)
 if mode=='day':
  feature=svg.replace(body+face, '<g transform="translate(0 -100)">'+body+face+'</g>').replace('cy="614" rx="89"', 'cy="514" rx="89"')
  (out/'daylight-feature.svg').write_text(feature)
(out/'daylight-icon.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="a" x2="1" y2="1"><stop stop-color="#d2e6d2"/><stop offset="1" stop-color="#8cae94"/></linearGradient></defs><rect width="128" height="128" rx="30" fill="url(#a)"/><circle cx="102" cy="26" r="14" fill="#f3d68b"/><path d="M0 103Q65 69 128 100v28H0" fill="#789c81"/><ellipse cx="64" cy="76" rx="27" ry="32" fill="#fcf3da"/><ellipse cx="56" cy="73" rx="2" ry="3" fill="#35574e"/><ellipse cx="72" cy="73" rx="2" ry="3" fill="#35574e"/><path d="M60 83q4 4 8 0" fill="none" stroke="#35574e" stroke-width="2" stroke-linecap="round"/></svg>''')
