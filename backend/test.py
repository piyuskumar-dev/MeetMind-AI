

from pytube import YouTube

#Creating video lists
video_list = ['https://www.youtube.com/watch?v=xTN2ktqKSBk', 'https://www.youtube.com/watch?v=w5Ji-VEnbmc']

#Looping through the list
for i in video_list:
  try:
    yt = YouTube(i)
    print('Downloading Link: ' + i)
    print('Downloading video: ' + yt.streams[0].title)
  except:
    print("Connection Error")

  #filters out all the files with "mp4" extension
  stream = yt.streams.filter(res="360p").first()
  stream.download("Downloads/")
print('Task Completed!')

