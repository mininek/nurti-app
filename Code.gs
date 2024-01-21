const morefeed_button = '<a class="grayLinkButton" href="javascript:moreFeed();">Daha</a>';
const feeddata_div = '<div id="feedData">';

function onOpen(){
  let ui = SpreadsheetApp.getUi();
  let menu = ui.createMenu('Nurti Menü');
  menu.addItem('Kullanıcı ata', 'set_user');
  menu.addItem('Nurti profil sayfalarını indir', 'check_user');
  menu.addItem('Başka kullanıcının profilini gir', 'get_other_user_feed');
  menu.addToUi();
  let curr_ss= SpreadsheetApp.getActiveSpreadsheet();
  let settings_sheet =curr_ss.getSheetByName('Settings');
  if(settings_sheet === null){
    curr_ss.insertSheet().setName('Settings').hideSheet();
  }
  let app_sheet = curr_ss.getSheetByName('AppSessions');
   if(app_sheet === null){
    curr_ss.insertSheet().setName('AppSessions').hideSheet();
  }

}
function set_user(){
  let ui = SpreadsheetApp.getUi();
  var set = new HTMLstring(templateParser('set_user', {}).getContent());
  set.addButton('Kaydet', 'saveData(myForm);\n', 'submit').addButton('Boşver');
  showHtmlDialog(set.makePublishable(), "Kullanıcı ata", 500, 200);
}
function get_other_user_feed(){
  let ui = SpreadsheetApp.getUi();
  let resp = ui.prompt('Profil sayfasını indirmek istediğiniz kullanıcı ismini yazın: ');
  let other_user;
  if(resp.getSelectedButton()==ui.Button.OK){
    other_user = resp.getResponseText();
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings').getRange('C4').setValue(other_user);
  }
}
function save_user_data(args){
  let settings_sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
  let user_range = settings_sheet.getRange('A2:D2');
  let [x, xx, old_username, old_img_setting]= user_range.getDisplayValues()[0];
  //label old user's data as DONE and erase old user settings
  if(old_username != args[2] || old_img_setting != args[3]){
    let old_user_folder=DriveApp.getFoldersByName('Nurti_'+old_username);
    if(old_user_folder.hasNext()){
      old_user_folder.next().setName('Nurti_'+old_username+'_DONE');
    }
    if(settings_sheet.getRange('E2').getDisplayValue()!= ''){
      let lastRow = getFirstEmptyRowByColumnArray(settings_sheet,'F')-1;
      settings_sheet.getRange('E2:N'+lastRow.toString() ).clearContent();
    }
    let cookies_sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AppSessions');
    cookies_sheet.getRange('A2:B2').clearContent();
  }
  user_range.setValues([args]);

}
function check_user(){
    var submit_onclick = " google.script.run.withSuccessHandler(google.script.host.close).set_user();\n      ";
    var start_dialog = " google.script.run.withSuccessHandler(google.script.host.close).downloadAllPages_dialog();\n      ";
    let settings_sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
    let user_data_arr = settings_sheet.getRange('A2:D4').getDisplayValues();
    let user_data= user_data_arr[0];
    let other_user_data = user_data_arr[2][2];
    if(other_user_data!=''){
      user_data[2]= user_data[2]+' (' + other_user_data+')';
    } 
    let img_choice =user_data[3];
    user_data[3]= img_choice=='both'? 'Büyük ve küçük resimler': img_choice=='small'? 'Küçük resimler': img_choice=='big'?'Büyük resimler':'Hiçbiri';
    if(user_data[1].length>3){
    user_data[1]= user_data[1].substring(0,3)+ '*'.repeat(user_data[1].length-3);
    }
    else 
    user_data[1]='***';
  var check = new HTMLstring(templateParser('check_user', user_data).getContent());
    check.addButton('Evet', start_dialog, 'submit')
    .addButton('Hayır, değiştrimek istiyorum', submit_onclick, 'submit' );
    showHtmlDialog(check.makePublishable(), "Sayfalarını indirmek istediğin kullanıcı bu mu?", 500, 200);
}
//download all pages popup
function downloadAllPages_dialog() {
    var generateDialog = new HTMLstring(templateParser('download_pages', {}).getContent());
    generateDialog.addButton('Kapat')
        .addButton('Başla', 'start();', 'submit');
    showHtmlDialog(generateDialog.makePublishable(), "Nurti sayflarını indir", 900, 600);
}
function get_or_create_folder(folderName, parent){
   let folders;
   if(parent)
    folders = parent.getFolders();
  else
    folders= DriveApp.getFolders();
    while(folders.hasNext()){
      let curr_folder = folders.next();
      let curr_name= curr_folder.getName();
      if(curr_name===folderName)
      return curr_folder;
    }
    if(parent){
    let folder = parent.createFolder(folderName);
    return folder;}
    else{
      let folder = DriveApp.createFolder(folderName);
    return folder;
    }
  
}
function get_morefeed(cookie, username, maxid, page){
  var url1 ='https://www.nurturia.com.tr/people/'+username+'/morefeed?maxId='+maxid+'&page='+page;
  
  var options = {
    "headers" : {"Cookie" : cookie }, 
    "method":"POST",
    "Origin":'https://www.nurturia.com.tr',
    "Referer": "https://www.nurturia.com.tr/people/"+username,
    "followRedirects" : true,
    "muteHttpExceptions": true
  };
  
  
  var resp  = UrlFetchApp.fetch(url1,options);
  var resp_code = resp.getResponseCode();
  var cont = resp.getContentText();
  if(resp_code ===200){
    return JSON.parse(cont);
    }
  else 
    throw JSON.parse(cont)['ErrorMessage'];
}
function get_comments(cookie, feedid){
  var url1 ='https://www.nurturia.com.tr/people/fetchexistingcomments'+'?id='+feedid;
  var options = {
    "headers" : {"Cookie" : cookie }, 
    "method":"POST",
    "Origin":'https://www.nurturia.com.tr',
    "Referer": "https://www.nurturia.com.tr/",
    "followRedirects" : true,
    "muteHttpExceptions": true
  };
  var resp  = UrlFetchApp.fetch(url1,options);
  var resp_code = resp.getResponseCode();
  var cont = resp.getContentText();
  if(resp_code ===200)
    return JSON.parse(cont);
  else 
    throw JSON.parse(cont)['ErrorMessage'];
}
function get_nurti_page(){
  let t0 = new Date().getTime();
  let settings_sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
  let profiles = settings_sheet.getRange('C2:C4').getDisplayValues();
  let cookie_profile =profiles[0][0];
  let other_profile = profiles[2][0]==''?cookie_profile : profiles[2][0];
  let template_file_name = 'nurti_template.html';
  let style_sheet_name='style.css';
  //get cookie
  let cookie;
  try{
    cookie = get_uptodate_cookie(cookie_profile);
  }
  catch(e){
    console.log(e);
    throw new Error('get_nurti_page could not get cookie. '+e.message);
  }
  
  let maxid_range=settings_sheet.getRange('E2');
  let maxid=maxid_range.getDisplayValue();
  let page_row= getFirstEmptyRowByColumnArray(settings_sheet,'F')-1;
  let page=page_row>1? settings_sheet.getRange(page_row,6).getValue():'1';
  let first_page_string='';
  let template_string = '';
  let style_sheet_string='';
  let style_sheet_links =[];
  let parent_folder = get_or_create_folder('Nurti_'+other_profile);

  if(maxid===''){ 
    first_page_string=get_first_page(other_profile,cookie);
    style_sheet_string = ' .feedDate {color:gray;} '+ UrlFetchApp.fetch('https://www.nurturia.com.tr/style/bundle?v=P5NfWEzpK-F4j5HyWVJZT3HVwEn63ueJMRgWS8WbT801').getBlob().getDataAsString();
    template_string=cleanup_page_string(first_page_string, other_profile==cookie_profile);
    parent_folder.createFile(template_file_name,template_string);
    maxid = first_page_string.split('maxId = ')[1].split(';',1)[0];
    settings_sheet.getRange(2,5,1,2).setValues([[maxid,page]]);
  }
  //create template file
  
  if(template_string === ''){
    let template_file = parent_folder.getFilesByName(template_file_name);
    if(!template_file.hasNext()){
      first_page_string=get_first_page(other_profile,cookie);
      template_string=cleanup_page_string(first_page_string,other_profile==cookie_profile);
      parent_folder.createFile(template_file_name,template_string);
    }
    else{
      template_string = template_file.next().getBlob().getDataAsString();
    }
  }
  //create style file
  let style_file = parent_folder.getFilesByName(style_sheet_name);
  if(!style_file.hasNext()){
    if(style_sheet_string ===''){
      style_sheet_string = ' .feedDate {color:gray;} '+UrlFetchApp.fetch('https://www.nurturia.com.tr/style/bundle?v=P5NfWEzpK-F4j5HyWVJZT3HVwEn63ueJMRgWS8WbT801').getBlob().getDataAsString();
    }
    //get style images and replace links
    style_sheet_links = style_sheet_string.split('/content/images/').slice(1).map(itm=> 'https://www.nurturia.com.tr/content/images/'+itm.split(")",1)[0]);
    style_sheet_links = style_sheet_links.map(itm => {if(itm.includes('"') || itm.includes("'")) return itm.substring(0, itm.length-1);else return itm;});
    style_sheet_string = style_sheet_string.replace(new RegExp('/content/images','g'), 'images/feed');
    parent_folder.createFile(style_sheet_name,style_sheet_string);
  }

  let num_comments =0;
  let num_posts = 0;
  let last_post_date ='';

  //get 5 pages for first one, otherwise get 20 pages every time
  let limit_pages = page<5? 5:20; 
  let new_posts_string='';
  let curr_post;
  let page_i = 0;
  let num_page_err = 0;
  for(let i=0; i<limit_pages && num_page_err<3; i++){
    let morefeed = get_morefeed(cookie, other_profile, maxid, page);
    if(morefeed.Success){
    let list = morefeed.List;
    let list_len = list.length;
    for(let k=0; k<list_len; k++){
      curr_post = list[k];
      new_posts_string = new_posts_string + '<div class="feedRow"><div class="feedImage">'+ curr_post.Image +'</div><div class="feedText">' + curr_post.Text +'&nbsp;</div></div>'
    }
    num_posts = num_posts + list_len;
    page++;
    page_i++;
    }
    else{
      console.log(morefeed);
      num_page_err++;
    }
  }
  if(num_page_err>2 && page_i<4){
    return '0|0|0|0|'+Math.ceil((new Date().getTime() - t0)/1000).toString()+'|done';
  }
  last_post_date = new Date();
  let date_string=curr_post.Date.split('(')[1].split(')')[0];
  last_post_date.setTime(parseInt(date_string));
  last_post_date_string = Utilities.formatDate(last_post_date,"GMT+3", "yyyy-MM-dd'__'HH-mm-ss");
  
  let template_arr = template_string.split(feeddata_div);
  first_page_string = template_arr[0]+feeddata_div+new_posts_string+template_arr[1];
  
  //add comments
  let fetchable_comments= first_page_string.split('<div id="fetch');
  let string_with_comments= fetchable_comments[0];
  fetchable_comments = fetchable_comments.slice(1);
  let comment_ids = fetchable_comments.map(itm=> itm.split('"',2)[0]);
  
  let comments_div_removed = fetchable_comments.map(itm => itm.split(')</a></div>')[1]);
  let num_fetches= comment_ids.length;
  let comment_obj;
  
  for(let i = 0; i<num_fetches; i++){
    let comment_div ='';
    comment_obj = get_comments(cookie, comment_ids[i]);
    if(comment_obj.Success){
      let comment_list = comment_obj.List||[];
      let num_list = comment_list.length;
      for(let k=0; k<num_list; k++){
        let curr_comment =comment_list[k];
        comment_div = comment_div+'<div class="looseTop"><div class="feedImage">'+curr_comment.Image+'</div><div class="feedText">'+curr_comment.Text+'</div></div>';
        num_comments++;
        
      }
    }
    else{
      console.log(comment_obj, comment_ids[i]);
    }
    
    string_with_comments= string_with_comments+comment_div+comments_div_removed[i];
    
  }
    
  
  //get images links for later 
  //get images links from txt file, if created peviously
  //link arrays
  let feed_links =[];
  let people_links=[];
  
  //folders
  let images_folder = get_or_create_folder('images', parent_folder);
  let feed_folder = get_or_create_folder('feed', images_folder);
  let people_folder = get_or_create_folder('people', images_folder);

  //file iterators
  let feed_file_it= feed_folder.getFilesByName('feed_images.txt');
  let people_file_it = people_folder.getFilesByName('people_images.txt');
  
  //file deifinitions
  let feed_file;
  let people_file;
 
  if( feed_file_it.hasNext()){
    feed_file = feed_file_it.next();
    feed_links = JSON.parse(feed_file.getBlob().getDataAsString());
  }
  else{
    feed_file= feed_folder.createFile('feed_images.txt', '[]');
  }
  if( people_file_it.hasNext()){
    people_file = people_file_it.next()
    people_links = JSON.parse(people_file.getBlob().getDataAsString());
  }
  else{
    people_file = people_folder.createFile('people_images.txt', '[]');
  }
  let people_links_new =string_with_comments.split('src="/images/people/').slice(1).map(itm=>'https://www.nurturia.com.tr/images/people/'+itm.split('"',1)[0]);
  let photos_links_new = string_with_comments.split('src="/images/photos/').slice(1).map(itm=>'https://www.nurturia.com.tr/images/photos/'+itm.split('"',1)[0]);
  let images_option = settings_sheet.getRange('D2').getDisplayValue();
  let feed_links_new =[];
  if(images_option === 'small'  || images_option === 'both'){
    feed_links_new = string_with_comments.split('src="/images/feed/').slice(1);
  }
  if(images_option === 'big' || images_option === 'both'){
    feed_links_new = feed_links_new.concat(string_with_comments.split('data-featherlight="/images/feed/').slice(1));
    photos_links_new = photos_links_new.concat(photos_links_new.map(itm=>itm.replace(new RegExp('_200.jpg','g'), '.jpg')));
  }
  let all_feed_links = feed_links.concat(feed_links_new.map(itm => 'https://www.nurturia.com.tr/images/feed/'+itm.split('"',1)[0])).concat(style_sheet_links).concat(photos_links_new);
  let all_unique_people_links = (people_links.concat(people_links_new)).filter((itm,indx,arr)=> arr.indexOf(itm)===indx);
  feed_file.setContent(JSON.stringify(all_feed_links));
  people_file.setContent(JSON.stringify(all_unique_people_links));
  

  string_with_comments = change_image_links(string_with_comments);
  let curr_page_file_name= other_profile+'_'+last_post_date_string+'.html';
  parent_folder.createFile(curr_page_file_name,string_with_comments ); 

  //page | last saved post date | number of posts	| number of comments |	new feed images |	new people images | time elapsed in sec
  //add stats to spreadsheet, for science!
  let row_to_write = getFirstEmptyRowByColumnArray(settings_sheet,'G');
  //put link for this page in previous page
  let prev_page_last_date = settings_sheet.getRange(row_to_write-1, 7).getDisplayValue();
  if(prev_page_last_date != 'last post date'){
    let prev_page_file_name=other_profile+'_'+prev_page_last_date+'.html';
    let prev_page_file = parent_folder.getFilesByName(prev_page_file_name).next();
    let prev_page_string = prev_page_file.getBlob().getDataAsString();
    prev_page_string = prev_page_string.replace('"javascript:moreFeed();"', '"'+curr_page_file_name+'"');
    prev_page_file.setTrashed(true);
    parent_folder.createFile(prev_page_file_name, prev_page_string);

  }
  let time_elapsed = Math.ceil((new Date().getTime() - t0)/1000);
  let results_arr = [page, last_post_date_string, num_posts, num_comments, time_elapsed ];
  settings_sheet.getRange(row_to_write, 6, 1, 5).setValues([results_arr]);
  if(page>5 && num_posts<(limit_pages*20)){
    return results_arr.join('|')+'|done';
  }
  else{
    throw results_arr.join('|');
  }
 
}

 function save_images(feed_or_people){
   console.log('starting with '+feed_or_people);
  let settings_sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
  let profiles = settings_sheet.getRange('C2:C4').getDisplayValues();
  let cookie_profile =profiles[0][0];
  let other_profile = profiles[2][0]==''?cookie_profile : profiles[2][0];
  let parent_folder = get_or_create_folder('Nurti_'+other_profile);
  let images_folder = get_or_create_folder('images', parent_folder);
  let fd_or_ppl_folder = get_or_create_folder(feed_or_people, images_folder);
  let file_it = fd_or_ppl_folder.getFilesByName(feed_or_people+'_images.txt');
  let link_list=[];
  let fd_or_ppl_file;
  if(file_it.hasNext()){
    fd_or_ppl_file = file_it.next();
    link_list = JSON.parse(fd_or_ppl_file.getBlob().getDataAsString());
  }
  let t0=new Date().getTime();
  let num_links = link_list.length;
  let t1=0;
  let curr_link_indx = 0;
  for(let i=0; i<num_links && t1<330; i++  ){
    let curr_link = link_list[i];
    let curr_link_split=curr_link.split('/');
    let img_name= curr_link_split[curr_link_split.length-1];
    let img;
    let img_resp;
    try{
      img_resp= UrlFetchApp.fetch(curr_link);
    } 
    catch(e){
      console.log('response code: '+e.message+' for '+curr_link);
    }
    let resp_code = img_resp? img_resp.getResponseCode(): 4000;
    if(resp_code==200 ||resp_code==304 ){
     img = img_resp.getBlob().setName(img_name);
     fd_or_ppl_folder.createFile(img);
    }
    else{
      console.log('response code: '+resp_code+' for '+curr_link);
    }
    t1 = Math.ceil((new Date().getTime() - t0)/1000);
    curr_link_indx = i+1;
  }
  let results_arr = [feed_or_people,curr_link_indx, num_links - curr_link_indx, Math.ceil((new Date().getTime() - t0)/1000)]
  let results = results_arr.join('|');
  console.log(results);
  let row_to_write = getFirstEmptyRowByColumnArray(settings_sheet,'K');
  settings_sheet.getRange(row_to_write, 11, 1, 4).setValues([results_arr]);
  if(curr_link_indx<num_links){
    fd_or_ppl_file.setContent(JSON.stringify(link_list.slice(curr_link_indx)));
    console.log('continuing with '+feed_or_people +', throwing results after erasing pictures that were done')
    throw results;
  }
  if(feed_or_people === 'feed'){
    fd_or_ppl_file.setContent('[]');
    console.log('done with feed images');
    return results +'|feed done';
  }
  else{
    fd_or_ppl_file.setContent('[]');
    console.log('done with people images');
    return results +'|people done'; 
  }

}

// Don's array approach - checks first column only.
// With added stopping condition & correct result.
// From answer https://stackoverflow.com/a/9102463/1677912
function getFirstEmptyRowByColumnArray(sheet, col_letter) {
  var column = sheet.getRange(col_letter+':'+col_letter);
  var values = column.getValues(); // get all data in one call
  var ct = 0;
  while ( values[ct] && values[ct][0] != "" ) {
    ct++;
  }
  return (ct+1);
}
//remove unnecessary html
function cleanup_page_string(page_string,same){
  //replace style css link
  page_string = page_string.replace(new RegExp('/style/bundle\\?v=P5NfWEzpK-F4j5HyWVJZT3HVwEn63ueJMRgWS8WbT801','g'), 'style.css');
  //remove top menu up to <div id="container">
  let remove_top_menu = page_string.split('<div id="topAd"',2);
  page_string = remove_top_menu[0]+ '<div id="container">'+ remove_top_menu[1].split('<div id="container">',2)[1];
  //remove new post box
  if(same){
    let microform_string= '<div id="microForm" class="looseTop">';
    let remove_postbox = page_string.split(microform_string);
    let first_part = remove_postbox[0];
    let second_part= remove_postbox[1].split('</div>').slice(10).join('</div>');
    page_string = first_part+microform_string+second_part;
  }
  //remove ad scripts
  let remove_script=page_string.split('<link rel="apple-itouch-icon" href="/apple-touch-icon.png" />');
  page_string = remove_script[0]+remove_script[1].split('<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>')[1];
  //remove all feed rows but leave the morefeed button
  let remove_feedrows= page_string.split('<div class="feedRow">',1)[0];
  let remove_feedrows2 = page_string.split(morefeed_button)[1];
  page_string=remove_feedrows+'<div id="moreButton" class="looseTop">'+morefeed_button +'</div>'+ remove_feedrows2;
  //remove scripts at the end;
  page_string = page_string.split('<script src="/script/bundle?v=fvi2kwkhE5atrtwmV2Pq73itFRuT1iqkZ58l1axNr4c1"></script>')[0];
  return page_string; 
}

//change image paths to match drive folders
function change_image_links(page_string){
  page_string = page_string.replace(new RegExp('imgcarouselcontainer" style="display:none','g'), 'imgcarouselcontainer" style="display:block');
  page_string = page_string.replace(new RegExp('/content/images/pro','g'), 'images/feed');
  page_string = page_string.replace(new RegExp('/content/images','g'), 'images/feed');
  page_string = page_string.replace(new RegExp('/Content/Images','g'), 'images/feed');
  let page_string_split = page_string.split('src="/images/photos/');
  let page_split_first = page_string_split[0];
  let page_split_links_at_zero = page_string_split.slice(1).map(itm=> itm.split('"'));
  for(let i =0; i<page_split_links_at_zero.length; i++){
    page_split_links_at_zero[i][0]=page_split_links_at_zero[i][0].split('/')[2];
  }
  page_string = page_split_first +'src="images/feed/' +page_split_links_at_zero.map(itm =>itm.join('"')).join('src="images/feed/');

  //page_string = page_string.replace(new RegExp('/photo/single','g'), 'images/feed');
  let photos_single_split = page_string.split('/photo/single/');
  let photos_split_first = photos_single_split[0];
  let photos_single_links_at_zero = photos_single_split.slice(1).map(itm=>itm.split('"'));
  for(let i=0; i<photos_single_links_at_zero.length; i++){
    photos_single_links_at_zero[i][0]=photos_single_links_at_zero[i][0].replace(new RegExp('-','g'), '')+'.jpg';
  }
  page_string=photos_split_first +'images/feed/' +photos_single_links_at_zero.map(itm=>itm.join('"')).join('images/feed/');
  
  page_string = page_string.replace(new RegExp('/images','g'), 'images');
  return page_string
}

function select_user_cookie(userid){
  var curr_sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AppSessions');
 
  var all_userids_cookies = curr_sheet.getRange('A2:B').getDisplayValues().filter(String);
  
  var cookie_index = all_userids_cookies.map(itm => itm[0].toString()).indexOf(userid);
  var app_cookie = cookie_index  <0? '': all_userids_cookies[cookie_index][1];
  return app_cookie;
  
}

function get_cookie(url, userid, pwd){
  //logout first
  UrlFetchApp.fetch('https://www.nurturia.com.tr/account/logout');
  pld ={ "Email":userid,
        "Password":pwd
      };
  var options =
      {
        "method" : "POST",
        "payload" : pld,
        "followRedirects" : false
      };
  var a=UrlFetchApp.fetch(url, options);
  var resp= a.getResponseCode();
  var hdrs = a.getAllHeaders();
  var cookies = [];
  
  if ( typeof hdrs['Set-Cookie'] !== 'undefined' ) {
    // Make sure that we are working with an array of cookies
    cookies = typeof hdrs['Set-Cookie'] == 'string' ? [ hdrs['Set-Cookie'] ] : hdrs['Set-Cookie'];
    for (var i = 0; i < cookies.length; i++) {
      // We only need the cookie's value - it might have path, expiry time, etc here
      cookies[i] = cookies[i].split( ';' )[0];
    };
    
  }
  else{
    let e =new Error('Response code: '+resp + ', Cookies not set!');
    throw e;
  }
  var session_cookies = cookies.join(';')
  save_cookie(userid, session_cookies);
  return session_cookies;
}
function save_cookie(userid, cookie){
  var cookie_sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AppSessions');
  cookie_sheet.getRange('A2:B2').setValues([[userid, cookie]]);
  SpreadsheetApp.flush();
}

function get_uptodate_cookie(){
  let curr_ss = SpreadsheetApp.getActiveSpreadsheet();
  let settings_sheet = curr_ss.getSheetByName('Settings');
  let [userid, pwd, username] = settings_sheet.getRange('A2:C2').getDisplayValues()[0];
  let cookie = curr_ss.getSheetByName('AppSessions').getRange('B2').getDisplayValue();  
  let check_url = 'https://www.nurturia.com.tr/';
  let page  = UrlFetchApp.fetch(check_url,{"headers" : {"Cookie" : cookie }, "method":"GET", 
    "Referer": "https://www.nurturia.com.tr/" });
  let page_text = page.getContentText();
  if(page_text.indexOf(username)<0){
    try{
      cookie=get_cookie('https://www.nurturia.com.tr/account/login',userid, pwd);
    }
    catch(e){
      throw e;
    }
  }
  return cookie;
}
function get_first_page(username, cookie){
  
    let url1 = 'https://www.nurturia.com.tr/people/'+username;
    let options = {
    "headers" : {"Cookie" : cookie }, 
    "method":"GET",
    "Origin":'https://www.nurturia.com.tr',
    "Referer": "https://www.nurturia.com.tr",
    "followRedirects" : true,
    "muteHttpExceptions": true
  }
  
  
  var resp  = UrlFetchApp.fetch(url1,options);
  var resp_code = resp.getResponseCode();
  var cont = resp.getContentText("UTF-8");
  if(resp_code ===200){
      return cont;
    
  }
  else 
    throw JSON.parse(cont)['ErrorMessage'];

}

function finishOnCancel() {
   let settings_sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Settings');
   let maxid_row = getFirstEmptyRowByColumnArray(settings_sheet,'E');
   let date_row = getFirstEmptyRowByColumnArray(settings_sheet,'G');
   if(date_row < maxid_row){
     settings_sheet.getRange(maxid_row-1, 5, 1,8).clearContent();
     let fldrs = DriveApp.getFoldersByName('Nurti_'+settings_sheet.getRange('C2').getDisplayValue());
     if(fldrs.hasNext()){
       fldrs.next().setTrashed(true);
     }
   }
  return 'done';
}
function templateParser(name, data) {
    var template = HtmlService.createTemplateFromFile(name);
    template.data = data;
    return template.evaluate();
}
function showHtmlDialog(html, title, width, height) {
    if (width === void 0) { width = 350; }
    if (height === void 0) { height = 150; }
    var htmlOutput = HtmlService
        .createHtmlOutput(html)
        .setWidth(width)
        .setHeight(height)
        .setSandboxMode(HtmlService.SandboxMode.NATIVE);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, title);
}

function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
var HTMLstring = (function () {
    function HTMLstring(htmlString) {
        this.body = htmlString;
        this.buttons = [];
    }
    HTMLstring.prototype.addButton = function (name, onclick_content, type) {
        if (name === void 0) { name = 'Cancel'; }
        if (onclick_content === void 0) { onclick_content = "setTimeout(function(){google.script.host.close();}, 100);"; }
        if (type === void 0) { type = "cancel"; }
        var buttonPressAnimation = "var btn = event.target; btn.classList.add('pressed');setTimeout(function () {btn.classList.remove('pressed'); "
            + onclick_content + "}, 300); ";
        var buttonHtml = "<div class=\"buttonTop\" style =\"margin-right:10px;\">\n    <button class =" + type + " onclick=\"" + buttonPressAnimation + "\" type=\"button\">" + name + "</button>\n    </div>";
        this.buttons.push({ name: name, buttonHtml: buttonHtml });
        return this;
    };
    HTMLstring.prototype.makePublishable = function () {
        var buttonString = "<div style=\"margin-top:10px;\">";
        buttonString = this.buttons.reduce(function (sum, button) { return sum + button.buttonHtml; }, buttonString) + "</div>";
        return "<div class=\"html-container\" >" + this.body + buttonString + "</div>";
    };
    return HTMLstring;
}());