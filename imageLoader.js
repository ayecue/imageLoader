(function($){
	var Timeout = 3000,
		$Window = $(window);
	
	function ImageCollection(){
		$.extend(this,{
			collection : []
		});
	}
	
	$.extend(ImageCollection.prototype,{
		add : function(object,options){
			var self = this;
			
			if (object instanceof ImageCollection){
				this.collection.push(object);
			} else if (object instanceof $) {
				object.each(function(){
					self.collection.push(new ImageInstance($(this),options));
				});
			}
		},
		item : function(index){
			return this.collection[index];
		},
		remove : function(index){
			!!this.item(index) && this.collection.splice(index,1);
		},
		size : function(){
			return this.collection.length;
		}
	});
		
	function ImageInstance(ctx,element,option){
		$.extend(this,{
			context : ctx,
			element : element,
			src : null,
			fn : null
		},option);
	}
	
	$.extend(ImageInstance,{
		cache : {},
		imagesToLoad : new ImageCollection()
	});
	
	$.extend(ImageInstance.prototype,{
		load : function(newSrc,newFn){
			var self = this,
				promise = $.Deferred(),
				src = !!newSrc ? (self.src = newSrc) : self.src,
				fn = !!newFn ? (self.fn = newFn) : self.fn;
				
			if (ImageInstance.cache[src]){
				setTimeout(function(){
					!!fn && fn.apply(self,ImageInstance.cache[src].args);
					promise.resolve(self);
				},0);
			} else {
				var nImage = new Image(),
					trys = 0,
					intv = setInterval(function(){
						if (++trys > Timeout){
							!!fn && fn.call(self,false,'ImageInstance: Can\'t load image (Timeout: ' + Timeout + ')!');
							promise.reject(self);
							clearInterval(intv);
						}
					},1);
				
				nImage.onload = function(){
					ImageInstance.cache[src] = self;
					self.args = arguments;
					!!fn && fn.apply(self,arguments);
					promise.resolve(self);
				};
				nImage.src = src;
			}
			
			return promise;
		}
	});
	
	function windowUpdate(){
		var screenTop = $Window.scrollTop(),
			screenLeft = $Window.scrollLeft(),
			screenRight = screenLeft + $Window.width(),
			screenBottom = screenTop + $Window.height();
		
		for (var index = ImageInstance.imagesToLoad.size(); index--;(function(ctx){
			var $context = ctx.context,
				$element = ctx.element,
				offset = $element.offset(),
				top = offset.top,
				left = offset.left,
				right = left + $element.outerWidth(),
				bottom = top + $element.outerHeight();
			
			if (
				(screenTop < top && screenBottom > top && screenRight > left && screenLeft < left)
				|| (screenTop < bottom && screenBottom > bottom && screenRight > left && screenLeft < left)
				|| (screenTop < top && screenBottom > top && screenRight > right && screenLeft < right)
				|| (screenTop < bottom && screenBottom > bottom && screenRight > right && screenLeft < right)
			) {
				$context.addClass('imageLoader-Loading');
				$element.addClass('imageLoader-Loading');
				
				ctx.load($element.data('imageloadersrc')).done(function(){
					$context
						.removeClass('imageLoader-Loading');
					
					$element
						.removeClass('imageLoader-Loading')
						.attr('src',ctx.src)
						.removeAttr('data-imageloadersrc');
					}).fail(function(){
					ImageInstance.imagesToLoad.add(ctx);
				});
				
				ImageInstance.imagesToLoad.remove(index);
			}
			
		})(ImageInstance.imagesToLoad.item(index)));
	};
			
	$Window
		.scroll(windowUpdate)
		.resize(windowUpdate);
		
	$.fn.activateImageLoader = function(options){
		return this.each(function(){
			var context = $(this);
			
			ImageInstance.imagesToLoad.add(context,context.find('img[data-imageLoaderSrc]'),options);
			windowUpdate();
		});
	};
})(jQuery);